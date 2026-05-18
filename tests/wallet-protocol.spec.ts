import { expect, type Page, test } from "@playwright/test";

const PROTOCOL_VERSION = "vela-wallet:v1";
const DUMMY_TX_BASE64 =
    "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIAG3M4O1C38e1U2VyEdvhHjOAT6n4g4s8bZq7L2m9cVh8qN9y8t8t8t8t8t8t8t8t8t8t8t8=";

async function setupWalletPage(page: Page, userId = "test-user") {
    await page.addInitScript(() => {
        if (typeof window.PublicKeyCredential !== "undefined") {
            (window.PublicKeyCredential as any).getClientCapabilities =
                async () => ({
                    prf: true,
                });
        } else {
            (window as any).PublicKeyCredential = class {
                static async getClientCapabilities() {
                    return { prf: true };
                }
            };
        }

        const originalGet = navigator.credentials.get.bind(
            navigator.credentials,
        );
        navigator.credentials.get = async (options: any) => {
            if (options?.publicKey) {
                const prfResult = new Uint8Array(32);
                for (let i = 0; i < 32; i++) prfResult[i] = i;
                return {
                    rawId: new ArrayBuffer(16),
                    getClientExtensionResults: () => ({
                        prf: {
                            results: {
                                first: prfResult.buffer,
                            },
                        },
                    }),
                } as any;
            }
            return originalGet(options);
        };
    });

    await page.goto(`/wallet/iframe?userId=${userId}`);

    await page.evaluate(() => {
        (window as any).__testMessages = [];
        window.addEventListener("message", (event) => {
            (window as any).__testMessages.push({
                data: event.data,
                origin: event.origin,
            });
        });
    });

    await page.getByRole("button", { name: "Connect with Passkey" }).click();
    await expect(page.getByText("Wallet Connected")).toBeVisible({
        timeout: 10000,
    });

    await page.evaluate(() => {
        (window as any).__testMessages = [];
    });
}

test.skip(
    ({ browserName }) => browserName === "webkit",
    "WebKit system libraries not installed",
);

test.describe("Wallet postMessage Protocol", () => {
    test("valid sign request round-trip", async ({ page }) => {
        await setupWalletPage(page);

        const requestId = "test-sign-1";

        await page.evaluate(
            ({ protocol, requestId, tx }) => {
                window.postMessage(
                    {
                        protocol,
                        type: "WALLET_SIGN",
                        requestId,
                        tx,
                        __testSent: true,
                    },
                    window.location.origin,
                );
            },
            { protocol: PROTOCOL_VERSION, requestId, tx: DUMMY_TX_BASE64 },
        );

        await page.getByRole("button", { name: /confirm/i }).click();

        await page.waitForFunction(
            ({ requestId }) => {
                const msgs = (window as any).__testMessages;
                return msgs.some(
                    (m: any) =>
                        !m.data?.__testSent &&
                        (m.data?.type === "WALLET_SIGN_RESPONSE" ||
                            m.data?.type === "WALLET_SIGN_ERROR") &&
                        m.data?.requestId === requestId,
                );
            },
            { requestId },
            { timeout: 10000 },
        );

        const response = await page.evaluate(
            ({ requestId }) => {
                const msgs = (window as any).__testMessages;
                return msgs.find(
                    (m: any) =>
                        !m.data?.__testSent &&
                        (m.data?.type === "WALLET_SIGN_RESPONSE" ||
                            m.data?.type === "WALLET_SIGN_ERROR") &&
                        m.data?.requestId === requestId,
                )?.data;
            },
            { requestId },
        );

        expect(response).toMatchObject({
            protocol: PROTOCOL_VERSION,
            requestId,
        });
        expect(
            response?.type === "WALLET_SIGN_RESPONSE" ||
                response?.type === "WALLET_SIGN_ERROR",
        ).toBe(true);
    });

    test("invalid origin message ignored", async ({ page }) => {
        await setupWalletPage(page);

        const requestId = "test-evil-1";
        const countBefore = await page.evaluate(
            () => (window as any).__testMessages.length,
        );

        await page.evaluate(
            ({ protocol, requestId }) => {
                const ev = new MessageEvent("message", {
                    data: {
                        protocol,
                        type: "WALLET_SIGN",
                        requestId,
                        tx: "dummy",
                    },
                    origin: "https://evil.com",
                    source: window,
                });
                window.dispatchEvent(ev);
            },
            { protocol: PROTOCOL_VERSION, requestId },
        );

        await page.waitForTimeout(500);

        const hasResponse = await page.evaluate(
            ({ requestId }) => {
                const msgs = (window as any).__testMessages;
                return msgs.some(
                    (m: any) =>
                        m.data?.requestId === requestId &&
                        (m.data?.type === "WALLET_SIGN_RESPONSE" ||
                            m.data?.type === "WALLET_SIGN_ERROR"),
                );
            },
            { requestId },
        );
        expect(hasResponse).toBe(false);
    });

    test("malformed message rejected", async ({ page }) => {
        await setupWalletPage(page);

        const countBefore = await page.evaluate(
            () => (window as any).__testMessages.length,
        );

        await page.evaluate(() => {
            window.postMessage(
                {
                    type: "WALLET_SIGN",
                    requestId: "test-malformed-1",
                    tx: "dummy",
                    __testSent: true,
                },
                window.location.origin,
            );
        });

        await page.waitForTimeout(500);

        const hasResponseMalformed = await page.evaluate(() => {
            const msgs = (window as any).__testMessages;
            return msgs.some(
                (m: any) =>
                    !m.data?.__testSent &&
                    (m.data?.type === "WALLET_SIGN_RESPONSE" ||
                        m.data?.type === "WALLET_SIGN_ERROR"),
            );
        });
        expect(hasResponseMalformed).toBe(false);
    });

    test("unknown protocol version rejected", async ({ page }) => {
        await setupWalletPage(page);

        const countBefore = await page.evaluate(
            () => (window as any).__testMessages.length,
        );

        await page.evaluate(() => {
            window.postMessage(
                {
                    protocol: "vela-wallet:v2",
                    type: "WALLET_SIGN",
                    requestId: "test-version-1",
                    tx: "dummy",
                    __testSent: true,
                },
                window.location.origin,
            );
        });

        await page.waitForTimeout(500);

        const hasResponseVersion = await page.evaluate(() => {
            const msgs = (window as any).__testMessages;
            return msgs.some(
                (m: any) =>
                    !m.data?.__testSent &&
                    (m.data?.type === "WALLET_SIGN_RESPONSE" ||
                        m.data?.type === "WALLET_SIGN_ERROR"),
            );
        });
        expect(hasResponseVersion).toBe(false);
    });

    test("timeout handling", async ({ page }) => {
        test.setTimeout(60000);
        await setupWalletPage(page);

        const requestId = "test-timeout-1";

        await page.evaluate(
            ({ protocol, requestId, tx }) => {
                window.postMessage(
                    {
                        protocol,
                        type: "WALLET_SIGN",
                        requestId,
                        tx,
                        __testSent: true,
                    },
                    window.location.origin,
                );
            },
            { protocol: PROTOCOL_VERSION, requestId, tx: DUMMY_TX_BASE64 },
        );

        await page.waitForFunction(
            ({ requestId }) => {
                const msgs = (window as any).__testMessages;
                return msgs.some(
                    (m: any) =>
                        !m.data?.__testSent &&
                        m.data?.type === "WALLET_SIGN_ERROR" &&
                        m.data?.requestId === requestId &&
                        m.data?.error === "Timeout",
                );
            },
            { requestId },
            { timeout: 40000 },
        );

        const response = await page.evaluate(
            ({ requestId }) => {
                const msgs = (window as any).__testMessages;
                return msgs.find(
                    (m: any) =>
                        !m.data?.__testSent &&
                        m.data?.type === "WALLET_SIGN_ERROR" &&
                        m.data?.requestId === requestId,
                )?.data;
            },
            { requestId },
        );

        expect(response).toMatchObject({
            protocol: PROTOCOL_VERSION,
            type: "WALLET_SIGN_ERROR",
            requestId,
            error: "Timeout",
        });
    });

    test("WALLET_READY handshake", async ({ page }) => {
        await setupWalletPage(page);

        const requestId = "test-ready-1";

        await page.evaluate(
            ({ protocol, requestId }) => {
                window.postMessage(
                    {
                        protocol,
                        type: "WALLET_READY",
                        requestId,
                        ready: true,
                        __testSent: true,
                    },
                    window.location.origin,
                );
            },
            { protocol: PROTOCOL_VERSION, requestId },
        );

        await page.waitForFunction(
            ({ requestId }) => {
                const msgs = (window as any).__testMessages;
                return msgs.some(
                    (m: any) =>
                        !m.data?.__testSent &&
                        m.data?.type === "WALLET_READY" &&
                        m.data?.requestId === requestId &&
                        m.data?.ready === true,
                );
            },
            { requestId },
            { timeout: 5000 },
        );

        const response = await page.evaluate(
            ({ requestId }) => {
                const msgs = (window as any).__testMessages;
                return msgs.find(
                    (m: any) =>
                        !m.data?.__testSent &&
                        m.data?.type === "WALLET_READY" &&
                        m.data?.requestId === requestId,
                )?.data;
            },
            { requestId },
        );

        expect(response).toMatchObject({
            protocol: PROTOCOL_VERSION,
            type: "WALLET_READY",
            requestId,
            ready: true,
        });
    });
});

"use client";

import { ShieldAlert, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/frontend/components/ui/alert";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/frontend/components/ui/card";
import { Spinner } from "@/frontend/components/ui/spinner";
import { cn } from "@/frontend/lib/utils";
import { MessageType, PROTOCOL_VERSION } from "@/frontend/wallet/protocol";
import {
    getWebAuthnCapabilities,
    hasWebAuthnSupport,
} from "@/frontend/wallet/webauthn-capabilities";

type PrfSupportState =
    | "checking"
    | "supported"
    | "unknown"
    | "unsupported"
    | "error";

type WalletDashboard = {
    userId: string;
    wallet: {
        walletId: string;
        publicKey: string;
        chain: string;
        status: string;
        createdAt: string;
        updatedAt: string;
    } | null;
    accesses: Array<{
        accessId: string;
        passkeyId: string;
        credentialId: string;
        kdfVersion: string;
        cipherVersion: string;
        createdAt: string;
        lastUsedAt: string | null;
    }>;
    passkeys: Array<{
        id: string;
        name: string | null;
        credentialId: string;
        createdAt: string | null;
    }>;
};

type WalletDashboardState =
    | { status: "loading"; data: null; error: null }
    | { status: "ready"; data: WalletDashboard; error: null }
    | { status: "error"; data: null; error: string }
    | { status: "unauthorized"; data: null; error: string };

async function fetchWalletDashboard(): Promise<WalletDashboardState> {
    const response = await fetch("/api/v1/wallet/me", {
        method: "GET",
        credentials: "include",
    });

    if (response.status === 401) {
        return {
            status: "unauthorized",
            data: null,
            error: "Sign in before creating an embedded wallet.",
        };
    }

    if (!response.ok) {
        return {
            status: "error",
            data: null,
            error: "Failed to load wallet metadata.",
        };
    }

    const payload = (await response.json()) as {
        response: WalletDashboard;
    };

    return {
        status: "ready",
        data: payload.response,
        error: null,
    };
}

function truncateAddress(address: string): string {
    if (address.length <= 18) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

export default function WalletPage() {
    const [supportState, setSupportState] =
        useState<PrfSupportState>("checking");
    const [detail, setDetail] = useState<string | null>(null);
    const [walletState, setWalletState] = useState<WalletDashboardState>({
        status: "loading",
        data: null,
        error: null,
    });
    const [selectedPasskeyId, setSelectedPasskeyId] = useState<string>("");

    useEffect(() => {
        let cancelled = false;

        async function detectSupport() {
            if (!hasWebAuthnSupport()) {
                if (!cancelled) {
                    setSupportState("unsupported");
                    setDetail(
                        "This browser does not expose the WebAuthn APIs required for passkeys.",
                    );
                }
                return;
            }

            try {
                const capabilities = await getWebAuthnCapabilities();
                const supported = capabilities?.["extension:prf"] === true;

                if (cancelled) return;

                if (capabilities === null) {
                    setSupportState("unknown");
                    setDetail(
                        "This browser does not expose WebAuthn capability detection. PRF may still work, so provisioning is allowed to proceed.",
                    );
                    return;
                }

                if (supported) {
                    setSupportState("supported");
                    setDetail(
                        capabilities
                            ? "PRF support detected. This device can provision the embedded wallet flow."
                            : "Basic WebAuthn support detected.",
                    );
                    return;
                }

                setSupportState("unsupported");
                setDetail(
                    capabilities
                        ? "Passkeys are available, but the PRF extension is not exposed by this browser or authenticator."
                        : "This browser does not expose WebAuthn capability detection or PRF support.",
                );
            } catch (error) {
                if (cancelled) return;

                setSupportState("error");
                setDetail(
                    error instanceof Error
                        ? error.message
                        : "Unable to verify PRF support in this browser.",
                );
            }
        }

        void detectSupport();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            const nextState = await fetchWalletDashboard();
            if (cancelled) return;
            setWalletState(nextState);
        }

        void loadDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (walletState.status !== "ready") {
            return;
        }

        const selectedExists = walletState.data.passkeys.some(
            (passkey) => passkey.id === selectedPasskeyId,
        );

        if (!selectedExists) {
            setSelectedPasskeyId(walletState.data.passkeys[0]?.id ?? "");
        }
    }, [selectedPasskeyId, walletState]);

    useEffect(() => {
        const handler = (event: MessageEvent<unknown>) => {
            if (event.origin !== window.location.origin) {
                return;
            }

            const payload = event.data as
                | {
                      protocol?: string;
                      type?: string;
                  }
                | undefined;

            if (
                payload?.protocol === PROTOCOL_VERSION &&
                payload.type === MessageType.WALLET_ADDRESS
            ) {
                void fetchWalletDashboard().then((nextState) => {
                    setWalletState(nextState);
                });
            }
        };

        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, []);

    const iframeEnabled =
        supportState === "supported" || supportState === "unknown";
    const walletReady = walletState.status === "ready" ? walletState.data : null;
    const selectedPasskey =
        walletReady?.passkeys.find((passkey) => passkey.id === selectedPasskeyId) ??
        null;
    const shouldShowProvisionIframe =
        iframeEnabled &&
        walletReady !== null &&
        !walletReady.wallet &&
        !!selectedPasskey;

    const iframeSrc = useMemo(() => {
        if (!shouldShowProvisionIframe || !walletReady || !selectedPasskey) {
            return null;
        }

        const params = new URLSearchParams({
            userId: walletReady.userId,
            passkeyId: selectedPasskey.id,
            credentialId: selectedPasskey.credentialId,
        });

        return `/iframe?${params.toString()}`;
    }, [selectedPasskey, shouldShowProvisionIframe, walletReady]);

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        VELA Wallet
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Provision an embedded Solana wallet backed by passkeys and
                        WebAuthn PRF.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="size-4" />
                            Wallet State
                        </CardTitle>
                        <CardDescription>
                            Server-side metadata used to decide whether the app
                            should provision a wallet or wait for the unlock flow.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {walletState.status === "loading" ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Spinner />
                                Loading wallet metadata...
                            </div>
                        ) : null}

                        {walletState.status === "unauthorized" ? (
                            <Alert variant="destructive">
                                <ShieldAlert className="size-4" />
                                <AlertTitle>Authentication required</AlertTitle>
                                <AlertDescription>
                                    {walletState.error}
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        {walletState.status === "error" ? (
                            <Alert variant="destructive">
                                <ShieldAlert className="size-4" />
                                <AlertTitle>Wallet metadata unavailable</AlertTitle>
                                <AlertDescription>
                                    {walletState.error}
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        {walletReady ? (
                            <>
                                {walletReady.wallet ? (
                                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                                        <p className="text-sm font-medium">
                                            Wallet already provisioned
                                        </p>
                                        <p className="mt-1 font-mono text-sm text-muted-foreground">
                                            {truncateAddress(
                                                walletReady.wallet.publicKey,
                                            )}
                                        </p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Unlock and reuse flows are the next
                                            implementation step. The wallet
                                            envelope is already stored.
                                        </p>
                                    </div>
                                ) : walletReady.passkeys.length === 0 ? (
                                    <Alert>
                                        <ShieldAlert className="size-4" />
                                        <AlertTitle>No passkeys available</AlertTitle>
                                        <AlertDescription>
                                            Register at least one passkey before
                                            creating an embedded wallet.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="wallet-passkey"
                                                className="text-sm font-medium"
                                            >
                                                Passkey used for provisioning
                                            </label>
                                            <select
                                                id="wallet-passkey"
                                                value={selectedPasskeyId}
                                                onChange={(event) =>
                                                    setSelectedPasskeyId(
                                                        event.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none"
                                            >
                                                {walletReady.passkeys.map(
                                                    (passkey, index) => (
                                                        <option
                                                            key={passkey.id}
                                                            value={passkey.id}
                                                        >
                                                            {passkey.name?.trim() ||
                                                                `Passkey ${index + 1}`}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            The selected passkey will derive the
                                            KEK that encrypts the master seed
                                            envelope stored on the backend.
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </CardContent>
                </Card>

                <Card className={cn(!shouldShowProvisionIframe && "opacity-70")}>
                    <CardHeader>
                        <CardTitle>Wallet Runtime</CardTitle>
                        <CardDescription>
                            Secure provisioning runs in an isolated iframe.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {shouldShowProvisionIframe && iframeSrc ? (
                            <iframe
                                key={iframeSrc}
                                id="wallet-iframe"
                                src={iframeSrc}
                                sandbox="allow-scripts allow-same-origin"
                                title="VELA Wallet Iframe"
                                width="100%"
                                height="600px"
                                className="rounded-xl border border-border bg-background"
                            />
                        ) : (
                            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                                {supportState === "checking"
                                    ? "Waiting for capability detection before starting the wallet runtime."
                                    : walletState.status === "loading"
                                      ? "Waiting for wallet metadata before starting provisioning."
                                      : walletReady?.wallet
                                        ? "Provisioning is complete. Unlock flow will reuse this wallet in the next phase."
                                        : walletReady && walletReady.passkeys.length === 0
                                          ? "The wallet runtime stays disabled until the account has at least one passkey."
                                          : "The wallet runtime stays disabled until PRF support and wallet prerequisites are available."}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

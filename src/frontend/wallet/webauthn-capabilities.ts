import { PrfNotSupportedError } from "./errors";

type WebAuthnCapabilities = Record<string, boolean>;
const CAPABILITIES_TIMEOUT_MS = 3000;
export const PRF_CAPABILITY_KEY = "extension:prf";

type PublicKeyCredentialWithCapabilities = typeof PublicKeyCredential & {
    getClientCapabilities?: () => Promise<WebAuthnCapabilities>;
};

export function hasWebAuthnSupport(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.credentials &&
        typeof navigator.credentials.get === "function" &&
        typeof PublicKeyCredential !== "undefined"
    );
}

async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(
                new Error("Timed out while checking WebAuthn capabilities."),
            );
        }, timeoutMs);

        promise.then(
            (value) => {
                clearTimeout(timeoutId);
                resolve(value);
            },
            (error) => {
                clearTimeout(timeoutId);
                reject(error);
            },
        );
    });
}

export async function getWebAuthnCapabilities(): Promise<WebAuthnCapabilities | null> {
    if (!hasWebAuthnSupport()) {
        return null;
    }

    const maybeWithCapabilities =
        PublicKeyCredential as PublicKeyCredentialWithCapabilities;

    if (typeof maybeWithCapabilities.getClientCapabilities !== "function") {
        return null;
    }

    try {
        return await withTimeout(
            maybeWithCapabilities.getClientCapabilities(),
            CAPABILITIES_TIMEOUT_MS,
        );
    } catch {
        return null;
    }
}

export async function supportsWebAuthnPrf(): Promise<boolean> {
    const capabilities = await getWebAuthnCapabilities();

    if (!capabilities) {
        return true;
    }

    return capabilities[PRF_CAPABILITY_KEY] === true;
}

export async function ensureWebAuthnPrfSupport(): Promise<void> {
    const supported = await supportsWebAuthnPrf();

    if (!supported) {
        throw new PrfNotSupportedError(
            "Your browser or authenticator does not support WebAuthn PRF.",
        );
    }
}

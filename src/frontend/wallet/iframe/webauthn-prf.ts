import { makePrfSalt } from "../../crypto/prf-solana";
import { PrfNotSupportedError, UserRejectedError } from "../errors";
import {
    getWebAuthnCapabilities,
    PRF_CAPABILITY_KEY,
} from "../webauthn-capabilities";

const textEncoder = new TextEncoder();
const RP_NAME = "vela";
const RP_ID =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
const USER_DISPLAY_NAME_PREFIX = "vela-user";
const TIMEOUT_MS = 60_000;

type PrfEval = {
    first: BufferSource;
};

type PrfExtensionOutput = {
    enabled?: boolean;
    results?: {
        first?: ArrayBuffer;
        second?: ArrayBuffer;
    };
};

type PublicKeyCredentialWithPrf = PublicKeyCredential & {
    getClientExtensionResults(): AuthenticationExtensionsClientOutputs & {
        prf?: PrfExtensionOutput;
    };
};

export interface RegisteredCredentialInfo {
    credentialId: string;
    rawId: ArrayBuffer;
    transports: AuthenticatorTransport[];
}

function ensureBrowserSupport(): void {
    if (typeof window === "undefined") {
        throw new PrfNotSupportedError(
            "WebAuthn PRF is only available in a browser context.",
        );
    }

    if (
        !navigator.credentials ||
        typeof navigator.credentials.create !== "function"
    ) {
        throw new PrfNotSupportedError(
            "Your browser does not support WebAuthn. Please use a modern browser like Chrome 132+.",
        );
    }

    if (typeof PublicKeyCredential === "undefined") {
        throw new PrfNotSupportedError(
            "PublicKeyCredential is not available in this browser.",
        );
    }
}

async function ensurePrfSupport(): Promise<void> {
    ensureBrowserSupport();
    const capabilities = await getWebAuthnCapabilities();

    if (!capabilities?.[PRF_CAPABILITY_KEY]) {
        throw new PrfNotSupportedError(
            "Your browser or authenticator does not support the PRF extension. Please use a compatible device.",
        );
    }
}

function randomBytes(length: number): Uint8Array {
    const output = new Uint8Array(length);
    crypto.getRandomValues(output);
    return output;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const out = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(out).set(bytes);
    return out;
}

function bufferSourceToArrayBuffer(source: BufferSource): ArrayBuffer {
    if (source instanceof ArrayBuffer) {
        return source;
    }

    const view = source as ArrayBufferView;
    const out = new ArrayBuffer(view.byteLength);
    new Uint8Array(out).set(
        new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
    );
    return out;
}

function toBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = padded + "=".repeat((4 - (padded.length % 4)) % 4);
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function mapWebAuthnError(error: unknown): Error {
    if (!(error instanceof DOMException)) {
        return error instanceof Error
            ? error
            : new Error("Unknown WebAuthn error");
    }

    switch (error.name) {
        case "NotAllowedError":
            return new UserRejectedError();
        case "NotSupportedError":
            return new PrfNotSupportedError();
        case "InvalidStateError":
            return new Error(
                "Credential is already registered on this authenticator",
            );
        case "SecurityError":
            return new Error(
                "WebAuthn operation blocked due to security restrictions",
            );
        case "AbortError":
            return new UserRejectedError();
        default:
            return new Error(`WebAuthn error: ${error.name}`);
    }
}

function encodeUserId(userId: string): Uint8Array {
    if (!userId || typeof userId !== "string") {
        throw new Error("userId must be a non-empty string");
    }
    return textEncoder.encode(userId);
}

export async function registerCredential(
    userId: string,
): Promise<RegisteredCredentialInfo> {
    await ensurePrfSupport();

    const userHandle = encodeUserId(userId);
    const prfInput = toArrayBuffer(makePrfSalt(userId));

    try {
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: toArrayBuffer(randomBytes(32)),
                rp: {
                    name: RP_NAME,
                    id: RP_ID,
                },
                user: {
                    id: toArrayBuffer(userHandle),
                    name: userId,
                    displayName: `${USER_DISPLAY_NAME_PREFIX}-${userId}`,
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                timeout: TIMEOUT_MS,
                authenticatorSelection: {
                    residentKey: "required",
                    userVerification: "required",
                },
                attestation: "none",
                extensions: {
                    prf: {
                        eval: {
                            first: prfInput,
                        } as PrfEval,
                    },
                } as AuthenticationExtensionsClientInputs,
            },
        });

        if (!credential || !(credential instanceof PublicKeyCredential)) {
            throw new Error("Failed to create passkey credential");
        }

        const response =
            credential.response as AuthenticatorAttestationResponse;
        return {
            credentialId: toBase64Url(credential.rawId),
            rawId: credential.rawId,
            transports: (response.getTransports?.() ??
                []) as AuthenticatorTransport[],
        };
    } catch (error) {
        throw mapWebAuthnError(error);
    }
}

export async function authenticateAndGetPrf(
    userId: string,
    credentialId?: string,
): Promise<ArrayBuffer> {
    await ensurePrfSupport();

    const prfInput = toArrayBuffer(makePrfSalt(userId));

    try {
        const assertion = (await navigator.credentials.get({
            publicKey: {
                challenge: toArrayBuffer(randomBytes(32)),
                timeout: TIMEOUT_MS,
                userVerification: "required",
                allowCredentials: credentialId
                    ? [
                          {
                              id: toArrayBuffer(fromBase64Url(credentialId)),
                              type: "public-key",
                          },
                      ]
                    : undefined,
                extensions: {
                    prf: {
                        eval: {
                            first: prfInput,
                        } as PrfEval,
                    },
                } as AuthenticationExtensionsClientInputs,
            },
        })) as PublicKeyCredentialWithPrf | null;

        if (!assertion) {
            throw new Error("Failed to authenticate with passkey");
        }

        const extensionResults = assertion.getClientExtensionResults();
        const prfResult = extensionResults.prf?.results?.first;

        if (!prfResult) {
            throw new Error("PRF output missing from WebAuthn assertion");
        }

        return bufferSourceToArrayBuffer(prfResult);
    } catch (error) {
        throw mapWebAuthnError(error);
    }
}

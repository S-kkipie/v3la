import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";

const textEncoder = new TextEncoder();
const KDF_VERSION = "HKDF-SHA256:v1";
const CIPHER_VERSION = "AES-GCM-256:v1";
const KEK_SALT = textEncoder.encode("vela:wallet-kek:v1");
const KEK_INFO = textEncoder.encode("solana-embedded-wallet-unlock:v1");
const IV_LENGTH = 12;
const MASTER_SEED_LENGTH = 32;

export type SeedEnvelopeMetadata = {
    chain: string;
    credentialId: string;
    userId: string;
    walletId: string;
};

export type SeedEnvelope = {
    wrappedSeed: string;
    iv: string;
    aad: string;
    kdfVersion: string;
    cipherVersion: string;
};

function ensureCryptoSupport(): void {
    if (
        typeof crypto === "undefined" ||
        !crypto.subtle ||
        typeof crypto.getRandomValues !== "function"
    ) {
        throw new Error("Web Crypto APIs are not available in this browser.");
    }
}

function ensureNonEmpty(value: string, name: string): void {
    if (!value || typeof value !== "string") {
        throw new Error(`${name} must be a non-empty string`);
    }
}

function toUint8Array(value: Uint8Array | ArrayBuffer): Uint8Array {
    return value instanceof Uint8Array ? value : new Uint8Array(value);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return copy.buffer;
}

function zeroBuffer(buffer: Uint8Array): void {
    buffer.fill(0);
}

function toBase64Url(bytes: Uint8Array): string {
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

function serializeMetadata(metadata: SeedEnvelopeMetadata): Uint8Array {
    ensureNonEmpty(metadata.walletId, "walletId");
    ensureNonEmpty(metadata.userId, "userId");
    ensureNonEmpty(metadata.credentialId, "credentialId");
    ensureNonEmpty(metadata.chain, "chain");

    return textEncoder.encode(
        JSON.stringify({
            chain: metadata.chain,
            credentialId: metadata.credentialId,
            userId: metadata.userId,
            walletId: metadata.walletId,
            version: 1,
        }),
    );
}

async function importAesKey(keyBytes: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        toArrayBuffer(keyBytes),
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
    );
}

export function generateMasterSeed(): Uint8Array {
    ensureCryptoSupport();
    const seed = new Uint8Array(MASTER_SEED_LENGTH);
    crypto.getRandomValues(seed);
    return seed;
}

export function deriveKekFromPrf(
    prfOutput: Uint8Array | ArrayBuffer,
): Uint8Array {
    ensureCryptoSupport();
    const input = toUint8Array(prfOutput);

    if (input.byteLength < 32) {
        throw new Error(
            `PRF output must be at least 32 bytes, got ${input.byteLength}`,
        );
    }

    return hkdf(sha256, input, KEK_SALT, KEK_INFO, 32);
}

export async function encryptMasterSeed(
    masterSeed: Uint8Array | ArrayBuffer,
    prfOutput: Uint8Array | ArrayBuffer,
    metadata: SeedEnvelopeMetadata,
): Promise<SeedEnvelope> {
    ensureCryptoSupport();
    const seedBytes = toUint8Array(masterSeed);

    if (seedBytes.byteLength !== MASTER_SEED_LENGTH) {
        throw new Error(
            `masterSeed must be exactly ${MASTER_SEED_LENGTH} bytes`,
        );
    }

    const iv = new Uint8Array(IV_LENGTH);
    crypto.getRandomValues(iv);
    const aad = serializeMetadata(metadata);
    const kekBytes = deriveKekFromPrf(prfOutput);

    try {
        const key = await importAesKey(kekBytes);
        const encrypted = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: toArrayBuffer(iv),
                additionalData: toArrayBuffer(aad),
            },
            key,
            toArrayBuffer(seedBytes),
        );

        return {
            wrappedSeed: toBase64Url(new Uint8Array(encrypted)),
            iv: toBase64Url(iv),
            aad: toBase64Url(aad),
            kdfVersion: KDF_VERSION,
            cipherVersion: CIPHER_VERSION,
        };
    } finally {
        zeroBuffer(kekBytes);
    }
}

export async function decryptMasterSeed(
    envelope: SeedEnvelope,
    prfOutput: Uint8Array | ArrayBuffer,
): Promise<Uint8Array> {
    ensureCryptoSupport();
    const kekBytes = deriveKekFromPrf(prfOutput);

    try {
        const key = await importAesKey(kekBytes);
        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: toArrayBuffer(fromBase64Url(envelope.iv)),
                additionalData: toArrayBuffer(fromBase64Url(envelope.aad)),
            },
            key,
            toArrayBuffer(fromBase64Url(envelope.wrappedSeed)),
        );

        return new Uint8Array(decrypted);
    } finally {
        zeroBuffer(kekBytes);
    }
}

export function zeroSensitiveBuffer(buffer: Uint8Array | ArrayBuffer): void {
    zeroBuffer(toUint8Array(buffer));
}

export const seedEnvelopeVersions = {
    kdfVersion: KDF_VERSION,
    cipherVersion: CIPHER_VERSION,
} as const;

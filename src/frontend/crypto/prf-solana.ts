import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { Keypair } from "@solana/web3.js";

const textEncoder = new TextEncoder();
const APP_NAME = "vela";

function toUint8Array(value: ArrayBuffer | Uint8Array): Uint8Array {
    return value instanceof Uint8Array ? value : new Uint8Array(value);
}

/**
 * Validates that prfOutput is a valid ArrayBuffer or Uint8Array with at least 32 bytes.
 */
function validatePrfOutput(prfOutput: ArrayBuffer | Uint8Array): void {
    if (prfOutput instanceof ArrayBuffer) {
        if (prfOutput.byteLength < 32) {
            throw new Error(
                `PRF output must be at least 32 bytes, got ${prfOutput.byteLength}`,
            );
        }
    } else if (prfOutput instanceof Uint8Array) {
        if (prfOutput.length < 32) {
            throw new Error(
                `PRF output must be at least 32 bytes, got ${prfOutput.length}`,
            );
        }
    } else {
        throw new Error("PRF output must be ArrayBuffer or Uint8Array");
    }
}

/**
 * Zeros out a Uint8Array buffer in-place for security.
 */
function zeroBuffer(buffer: Uint8Array): void {
    buffer.fill(0);
}

function validateMasterSeed(seed: ArrayBuffer | Uint8Array): void {
    const bytes = toUint8Array(seed);
    if (bytes.length !== 32) {
        throw new Error(`Master seed must be exactly 32 bytes, got ${bytes.length}`);
    }
}

export function makePrfSalt(userId: string): Uint8Array {
    if (!userId || typeof userId !== "string" || userId.length === 0) {
        throw new Error("userId must be a non-empty string");
    }
    /**
     * This salt is not secret.
     * It must be stable so that the wallet is stable.
     * Changing this string changes the derived wallet.
     */
    return sha256(textEncoder.encode(`${APP_NAME}:solana-wallet:v1:${userId}`));
}

export function deriveSolanaSeedFromPrf(
    prfOutput: ArrayBuffer | Uint8Array,
    salt?: Uint8Array,
): Uint8Array {
    validatePrfOutput(prfOutput);
    const inputKeyMaterial = toUint8Array(prfOutput);

    const saltBytes =
        salt ?? textEncoder.encode(`${APP_NAME}:prf-wallet:salt:v1`);

    /**
     * HKDF extracts and expands the PRF output to a 32-byte seed for the Solana Keypair.
     * This ensures the seed is exactly 32 bytes long, as required by Keypair.fromSeed.
     */
    return hkdf(
        sha256,
        inputKeyMaterial,
        saltBytes,
        textEncoder.encode("solana-ed25519-keypair:v1"),
        32,
    );
}

/**
 * Derives a Solana Keypair from PRF output using a userId-derived salt.
 * Zeros out buffers after derivation for security.
 *
 * @param prfOutput - The raw PRF output from WebAuthn (ArrayBuffer or Uint8Array, >= 32 bytes)
 * @param userId - Unique user identifier for salt derivation
 * @returns Solana Keypair
 */
export function deriveWalletFromPrf(
    prfOutput: ArrayBuffer | Uint8Array,
    userId: string,
): Keypair {
    if (!userId || typeof userId !== "string" || userId.length === 0) {
        throw new Error("userId must be a non-empty string");
    }

    const salt = makePrfSalt(userId);
    const seed = deriveSolanaSeedFromPrf(prfOutput, salt);

    const keypair = Keypair.fromSeed(seed);

    if (prfOutput instanceof Uint8Array) {
        zeroBuffer(prfOutput);
    }
    zeroBuffer(seed);

    return keypair;
}

export function deriveWalletFromSeed(
    masterSeed: ArrayBuffer | Uint8Array,
): Keypair {
    validateMasterSeed(masterSeed);
    return Keypair.fromSeed(toUint8Array(masterSeed));
}

/**
 * @deprecated Use deriveWalletFromPrf(prfOutput, userId) instead for deterministic wallet derivation.
 * This function uses a static salt and will not produce consistent wallets across devices.
 */
export function keypairFromPrf(prfOutput: ArrayBuffer | Uint8Array): Keypair {
    validatePrfOutput(prfOutput);
    const seed = deriveSolanaSeedFromPrf(prfOutput);
    const keypair = Keypair.fromSeed(seed);
    zeroBuffer(seed);
    return keypair;
}

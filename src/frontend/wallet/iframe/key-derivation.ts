import { type Keypair, Transaction } from "@solana/web3.js";
import { deriveWalletFromPrf } from "../../crypto/prf-solana";

/**
 * Module-level state for the derived wallet.
 * Stored in closure — NOT exported and NOT attached to window.
 * Reset on every iframe reload (no persistence).
 */
let derivedKeypair: Keypair | null = null;
let walletAddress: string | null = null;

/**
 * Derives a deterministic Solana wallet from PRF output and userId.
 * Stores the keypair in module-level closure memory.
 * Zeros out the PRF output buffer after derivation.
 *
 * @param userId - Unique user identifier
 * @param prfOutput - Raw PRF output from WebAuthn (ArrayBuffer, >= 32 bytes)
 * @returns Base58-encoded wallet address
 */
export function deriveWallet(userId: string, prfOutput: ArrayBuffer): string {
    if (!userId || typeof userId !== "string" || userId.length === 0) {
        throw new Error("userId must be a non-empty string");
    }
    if (!prfOutput || !(prfOutput instanceof ArrayBuffer)) {
        throw new Error("prfOutput must be a valid ArrayBuffer");
    }

    const keypair = deriveWalletFromPrf(prfOutput, userId);
    derivedKeypair = keypair;
    walletAddress = keypair.publicKey.toBase58();

    // Zero out the PRF output ArrayBuffer after derivation
    const view = new Uint8Array(prfOutput);
    view.fill(0);

    return walletAddress;
}

export function getWalletAddress(): string | null {
    return walletAddress;
}

export function isWalletReady(): boolean {
    return derivedKeypair !== null && walletAddress !== null;
}

/**
 * Signs a base64-encoded serialized Solana transaction.
 * Returns the base64-encoded signed transaction.
 *
 * @param serializedTx - Base64-encoded serialized transaction
 * @returns Base64-encoded signed transaction
 * @throws If wallet has not been derived
 */
export function signTransaction(serializedTx: string): string {
    if (!derivedKeypair) {
        throw new Error("Wallet not derived. Call deriveWallet() first.");
    }
    if (!serializedTx || typeof serializedTx !== "string") {
        throw new Error("serializedTx must be a non-empty base64 string");
    }

    const txBuffer = Buffer.from(serializedTx, "base64");
    const transaction = Transaction.from(txBuffer);

    transaction.sign(derivedKeypair);

    const signedSerialized = transaction.serialize();
    return Buffer.from(signedSerialized).toString("base64");
}

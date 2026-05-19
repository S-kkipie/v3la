import { type Keypair, Transaction } from "@solana/web3.js";
import { deriveWalletFromSeed } from "../../crypto/prf-solana";

/**
 * Module-level state for the derived wallet.
 * Stored in closure — NOT exported and NOT attached to window.
 * Reset on every iframe reload (no persistence).
 */
let derivedKeypair: Keypair | null = null;
let walletAddress: string | null = null;

/**
 * Hydrates a Solana wallet from a 32-byte master seed.
 * Stores the keypair in module-level closure memory.
 * Zeros out the seed buffer after derivation.
 *
 * @param masterSeed - 32-byte master seed
 * @returns Base58-encoded wallet address
 */
export function hydrateWalletFromSeed(masterSeed: ArrayBuffer): string {
    if (!masterSeed || !(masterSeed instanceof ArrayBuffer)) {
        throw new Error("masterSeed must be a valid ArrayBuffer");
    }

    const keypair = deriveWalletFromSeed(masterSeed);
    derivedKeypair = keypair;
    walletAddress = keypair.publicKey.toBase58();

    // Zero out the master seed ArrayBuffer after derivation
    const view = new Uint8Array(masterSeed);
    view.fill(0);

    return walletAddress;
}

export function getWalletAddress(): string | null {
    return walletAddress;
}

export function isWalletReady(): boolean {
    return derivedKeypair !== null && walletAddress !== null;
}

export function clearWallet(): void {
    derivedKeypair = null;
    walletAddress = null;
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

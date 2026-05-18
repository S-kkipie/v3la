/**
 * Typed error classes for the VELA embedded wallet.
 *
 * All errors extend WalletError so consumers can catch the base class
 * for generic handling or the specific subclass for programmatic decisions.
 * Each error provides a user-friendly message suitable for UI display.
 */

/**
 * Base error class for all wallet-related errors.
 */
export class WalletError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "WalletError";
    }
}

/**
 * Thrown when the browser or authenticator does not support WebAuthn PRF.
 */
export class PrfNotSupportedError extends WalletError {
    constructor(
        message = "Your browser or device does not support passkey PRF. Please use Chrome 132+ with a compatible authenticator.",
    ) {
        super(message);
        this.name = "PrfNotSupportedError";
    }
}

/**
 * Thrown when a request to the wallet iframe times out.
 */
export class TimeoutError extends WalletError {
    constructor(requestId?: string) {
        super(
            requestId
                ? `Request timed out. Please try again.`
                : `The wallet took too long to respond. Please try again.`,
        );
        this.name = "TimeoutError";
    }
}

/**
 * Thrown when the user cancels or rejects a wallet prompt.
 */
export class UserRejectedError extends WalletError {
    constructor(requestId?: string) {
        super(
            requestId
                ? `You cancelled the request. No transaction was sent.`
                : `You cancelled the request. No transaction was sent.`,
        );
        this.name = "UserRejectedError";
    }
}

/**
 * Thrown when the wallet iframe is not loaded, not ready, or disconnected.
 */
export class WalletNotReadyError extends WalletError {
    constructor(
        message = "The wallet is not ready yet. Please wait for it to load and try again.",
    ) {
        super(message);
        this.name = "WalletNotReadyError";
    }
}

/**
 * Thrown when a Solana address is malformed or invalid.
 */
export class InvalidAddressError extends WalletError {
    constructor(address?: string) {
        super(
            address
                ? `"${address}" is not a valid Solana address. Please check and try again.`
                : `The address provided is not valid. Please check and try again.`,
        );
        this.name = "InvalidAddressError";
    }
}

/**
 * Thrown when the wallet does not have enough SOL to complete a transaction.
 */
export class InsufficientBalanceError extends WalletError {
    constructor(
        message = "Your wallet does not have enough SOL to complete this transaction. Please add funds and try again.",
    ) {
        super(message);
        this.name = "InsufficientBalanceError";
    }
}

/**
 * Thrown when a network request to the Solana RPC fails.
 */
export class NetworkError extends WalletError {
    constructor(
        message = "Network error. Please check your internet connection and try again.",
    ) {
        super(message);
        this.name = "NetworkError";
    }
}

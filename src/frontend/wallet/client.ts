/**
 * EmbeddedWalletClient - Parent app postMessage client for wallet iframe communication
 *
 * Handles connection lifecycle, signing requests, and address retrieval via postMessage.
 * Uses vela-wallet:v1 protocol with requestId correlation for response matching.
 */

import {
    TimeoutError,
    UserRejectedError,
    WalletError,
    WalletNotReadyError,
} from "./errors";
import {
    createSignRequest,
    MessageType,
    parseMessage,
    type WalletAddress,
    type WalletMessage,
} from "./protocol";

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export interface EmbeddedWalletClientOptions {
    onConnect?: (address: string) => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
}

interface PendingRequest {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Client for communicating with an embedded wallet iframe via postMessage.
 *
 * @example
 * ```typescript
 * const client = new EmbeddedWalletClient();
 * const address = await client.connect(iframe);
 *
 * // Sign a transaction
 * const signature = await client.signTransaction(serializedTx);
 *
 * // Clean up
 * client.disconnect();
 * ```
 */
export class EmbeddedWalletClient {
    private iframe: HTMLIFrameElement | null = null;
    private messageHandler: ((event: MessageEvent<unknown>) => void) | null =
        null;
    private pendingRequests = new Map<string, PendingRequest>();
    private options: EmbeddedWalletClientOptions;
    private _address: string | null = null;

    constructor(options: EmbeddedWalletClientOptions = {}) {
        this.options = options;
        this.iframe = null;
        this.messageHandler = null;
    }

    /**
     * Returns the connected wallet address, or null if not connected.
     */
    get address(): string | null {
        return this._address;
    }

    /**
     * Checks if the wallet is connected (has received an address).
     */
    isConnected(): boolean {
        return this._address !== null;
    }

    /**
     * Connects to the wallet iframe and waits for the wallet to send
     * its address after WebAuthn authentication and key derivation.
     *
     * @param iframe - The iframe element containing the wallet
     * @returns Promise resolving to the wallet address
     * @throws {WalletNotReadyError} If connection times out
     */
    async connect(iframe: HTMLIFrameElement): Promise<string> {
        if (this.iframe) {
            this.disconnect();
        }

        this.iframe = iframe;

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(
                    new WalletNotReadyError(
                        "The wallet took too long to connect. Please refresh the page and try again.",
                    ),
                );
            }, 30000);

            this.messageHandler = (event: MessageEvent<unknown>) => {
                if (!this.isValidOrigin(event)) {
                    return;
                }

                let message: WalletMessage;
                try {
                    message = parseMessage(event.data);
                } catch {
                    return;
                }

                // Handle proactive WALLET_ADDRESS from iframe after derivation
                if (message.type === MessageType.WALLET_ADDRESS) {
                    const addrMessage = message as WalletAddress;
                    this._address = addrMessage.address;
                    clearTimeout(timeoutId);
                    this.options.onConnect?.(addrMessage.address);
                    resolve(addrMessage.address);
                    return;
                }

                // Handle other responses via requestId correlation
                this.handleResponse(message);
            };

            window.addEventListener("message", this.messageHandler);
        });
    }

    /**
     * Signs a transaction via the wallet iframe.
     *
     * @param serializedTx - Base64-encoded serialized transaction
     * @returns Promise resolving to the base64-encoded signature
     * @throws {TimeoutError} If iframe doesn't respond within 30s
     * @throws {UserRejectedError} If user rejects the signing
     * @throws {WalletNotReadyError} If wallet is not connected
     */
    async signTransaction(serializedTx: string): Promise<string> {
        if (!this.iframe) {
            throw new WalletNotReadyError("Not connected to wallet iframe");
        }

        const requestId = this.generateRequestId();
        const signRequest = createSignRequest(serializedTx, requestId);

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new TimeoutError());
            }, DEFAULT_REQUEST_TIMEOUT_MS);

            this.pendingRequests.set(requestId, {
                resolve: (value) => resolve(value as string),
                reject,
                timeoutId,
            });

            this.sendToIframe(signRequest);
        });
    }

    /**
     * Retrieves the wallet's public address.
     *
     * @returns The base58-encoded public address
     * @throws {WalletNotReadyError} If wallet is not connected
     */
    getAddress(): string {
        if (!this._address) {
            throw new WalletNotReadyError("Wallet address not yet received");
        }
        return this._address;
    }

    /**
     * Disconnects from the wallet iframe and cleans up resources.
     * Removes message listener, clears iframe reference, and cancels pending requests.
     */
    disconnect(): void {
        if (this.messageHandler) {
            window.removeEventListener("message", this.messageHandler);
            this.messageHandler = null;
        }

        for (const [, pending] of this.pendingRequests) {
            clearTimeout(pending.timeoutId);
            pending.reject(new WalletError("Client disconnected"));
        }
        this.pendingRequests.clear();

        this._address = null;
        this.iframe = null;
        this.options.onDisconnect?.();
    }

    /**
     * Internal handler for incoming postMessage responses.
     * Matches requestId and resolves/rejects the corresponding promise.
     */
    private handleResponse(message: WalletMessage): void {
        const pending = this.pendingRequests.get(message.requestId);
        if (!pending) {
            return;
        }

        this.clearRequest(message.requestId);

        switch (message.type) {
            case MessageType.WALLET_SIGN_RESPONSE:
                pending.resolve((message as { signature: string }).signature);
                break;

            case MessageType.WALLET_SIGN_ERROR: {
                const error = (message as { error: string }).error;
                if (error === "User rejected") {
                    pending.reject(new UserRejectedError());
                } else {
                    pending.reject(new WalletError(`Signing failed: ${error}`));
                }
                break;
            }

            case MessageType.WALLET_ADDRESS:
                pending.resolve((message as { address: string }).address);
                break;

            default:
                pending.reject(
                    new WalletError(`Unexpected message type: ${message.type}`),
                );
        }
    }

    /**
     * Validates that the event origin matches the parent window's origin.
     * Prevents processing messages from unexpected origins.
     */
    private isValidOrigin(event: MessageEvent<unknown>): boolean {
        if (typeof window === "undefined") {
            return false;
        }
        // Allow null origin (file:// etc) for local development
        if (event.origin === "null" || event.origin === "") {
            return true;
        }
        return event.origin === window.location.origin;
    }

    /**
     * Sends a message to the iframe via postMessage.
     */
    private sendToIframe(message: object): void {
        if (!this.iframe?.contentWindow) {
            throw new WalletNotReadyError("Iframe not available");
        }
        this.iframe.contentWindow.postMessage(message, window.location.origin);
    }

    /**
     * Clears a pending request and its timeout.
     */
    private clearRequest(requestId: string): void {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingRequests.delete(requestId);
        }
    }

    /**
     * Generates a unique request ID for message correlation.
     */
    private generateRequestId(): string {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }
}

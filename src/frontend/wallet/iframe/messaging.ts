import {
    MessageType,
    parseMessage,
    type SignError,
    type SignRequest,
    type SignResponse,
    type WalletMessage,
    type WalletReady,
} from "../protocol";

const SIGN_TIMEOUT_MS = 30_000;

export interface MessageHandlerOptions {
    isWalletReady: () => boolean;
    onApproveRequest: (request: SignRequest) => Promise<boolean>;
    signTransaction: (tx: string) => Promise<string>;
    onError?: (error: Error, requestId?: string) => void;
}

function sendToParent(message: WalletMessage): void {
    if (typeof window === "undefined" || !window.parent) {
        return;
    }
    window.parent.postMessage(message, window.location.origin);
}

function createSignResponse(
    requestId: string,
    signature: string,
): SignResponse {
    return {
        protocol: "vela-wallet:v1",
        type: MessageType.WALLET_SIGN_RESPONSE,
        requestId,
        signature,
    };
}

function createSignError(requestId: string, error: string): SignError {
    return {
        protocol: "vela-wallet:v1",
        type: MessageType.WALLET_SIGN_ERROR,
        requestId,
        error,
    };
}

function createWalletReadyResponse(requestId: string): WalletReady {
    return {
        protocol: "vela-wallet:v1",
        type: MessageType.WALLET_READY,
        requestId,
        ready: true,
    };
}

export function setupMessageHandlers(
    options: MessageHandlerOptions,
): () => void {
    const { isWalletReady, onApproveRequest, signTransaction, onError } =
        options;
    const pendingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

    const handler = (event: MessageEvent<unknown>) => {
        if (event.origin !== window.location.origin) {
            return;
        }

        if (event.origin === "null") {
            return;
        }

        let message: WalletMessage;
        try {
            message = parseMessage(event.data);
        } catch {
            return;
        }

        const { type, requestId } = message;

        switch (type) {
            case MessageType.WALLET_READY: {
                const ready = isWalletReady();
                if (ready) {
                    sendToParent(createWalletReadyResponse(requestId));
                }
                break;
            }

            case MessageType.WALLET_SIGN: {
                const signRequest = message as SignRequest;

                if (!isWalletReady()) {
                    sendToParent(
                        createSignError(requestId, "Wallet not ready"),
                    );
                    return;
                }

                const timeoutId = setTimeout(() => {
                    pendingTimeouts.delete(requestId);
                    sendToParent(createSignError(requestId, "Timeout"));
                }, SIGN_TIMEOUT_MS);

                pendingTimeouts.set(requestId, timeoutId);

                onApproveRequest(signRequest)
                    .then((approved) => {
                        const t = pendingTimeouts.get(requestId);
                        if (t) {
                            clearTimeout(t);
                            pendingTimeouts.delete(requestId);
                        } else {
                            return;
                        }

                        if (!approved) {
                            sendToParent(
                                createSignError(requestId, "User rejected"),
                            );
                            return;
                        }

                        return signTransaction(signRequest.tx);
                    })
                    .then((signature) => {
                        if (signature) {
                            sendToParent(
                                createSignResponse(requestId, signature),
                            );
                        }
                    })
                    .catch((err) => {
                        const t = pendingTimeouts.get(requestId);
                        if (t) {
                            clearTimeout(t);
                            pendingTimeouts.delete(requestId);
                        }
                        const errorMessage =
                            err instanceof Error
                                ? err.message
                                : "Signing failed";
                        sendToParent(createSignError(requestId, errorMessage));
                        onError?.(
                            err instanceof Error ? err : new Error(String(err)),
                            requestId,
                        );
                    });

                break;
            }

            default:
                break;
        }
    };

    window.addEventListener("message", handler);

    return () => {
        window.removeEventListener("message", handler);
        for (const [, timeoutId] of pendingTimeouts) {
            clearTimeout(timeoutId);
        }
        pendingTimeouts.clear();
    };
}

export { sendToParent };

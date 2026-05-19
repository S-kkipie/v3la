"use client";

import { Loader2 } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/frontend/components/ui/card";
import { MessageType } from "../protocol";
import { ApprovalUI } from "./components/ApprovalUI";
import {
    clearWallet,
    hydrateWalletFromSeed,
    isWalletReady,
    signTransaction,
} from "./key-derivation";
import { sendToParent, setupMessageHandlers } from "./messaging";
import {
    encryptMasterSeed,
    generateMasterSeed,
    seedEnvelopeVersions,
    zeroSensitiveBuffer,
} from "./seed-envelope";
import {
    reset,
    setAddress,
    setError,
    setStatus,
    useWalletState,
} from "./state";
import { authenticateAndGetPrf } from "./webauthn-prf";

type WalletIframeMode = "provision";

type WalletIframeParams = {
    userId: string | null;
    credentialId: string | null;
    passkeyId: string | null;
    mode: WalletIframeMode;
};

type ProvisionResponse = {
    response: {
        walletId: string;
        publicKey: string;
        chain: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        accessId: string;
        passkeyId: string;
        credentialId: string;
    };
    code: "OK";
    status: 200;
};

function createWalletAddressMessage(requestId: string, address: string) {
    return {
        protocol: "vela-wallet:v1",
        type: MessageType.WALLET_ADDRESS,
        requestId,
        address,
    };
}

function parseWalletIframeParams(search: string): WalletIframeParams {
    const params = new URLSearchParams(search);
    return {
        userId: params.get("userId"),
        credentialId: params.get("credentialId"),
        passkeyId: params.get("passkeyId"),
        mode: "provision",
    };
}

async function provisionWallet(params: {
    userId: string;
    credentialId: string;
    passkeyId: string;
}): Promise<string> {
    console.debug("[WalletIframe] Starting provisionWallet with params:", {
        ...params,
        userId: "HIDDEN_FOR_LOGS",
    });
    const { credentialId, passkeyId, userId } = params;

    if (typeof crypto.randomUUID !== "function") {
        console.error("[WalletIframe] crypto.randomUUID is not available");
        throw new Error("crypto.randomUUID is not available in this browser.");
    }

    console.debug("[WalletIframe] Authenticating and getting PRF...");
    const prfOutput = await authenticateAndGetPrf(userId, credentialId);
    console.debug(
        "[WalletIframe] Successfully got PRF output, length:",
        prfOutput.byteLength,
    );
    const walletId = crypto.randomUUID();
    const generatedSeed = generateMasterSeed();
    const seedForEnvelope = generatedSeed.slice();
    const seedForWallet = generatedSeed.slice();
    zeroSensitiveBuffer(generatedSeed);

    try {
        const envelope = await encryptMasterSeed(seedForEnvelope, prfOutput, {
            walletId,
            userId,
            credentialId,
            chain: "solana",
        });
        zeroSensitiveBuffer(seedForEnvelope);

        const address = hydrateWalletFromSeed(
            seedForWallet.buffer.slice(
                seedForWallet.byteOffset,
                seedForWallet.byteOffset + seedForWallet.byteLength,
            ),
        );

        console.debug("[WalletIframe] Sending provision request to API...", {
            walletId,
            publicKey: address,
        });
        const response = await fetch("/api/v1/wallet/provision", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                walletId,
                publicKey: address,
                passkeyId,
                wrappedSeed: envelope.wrappedSeed,
                iv: envelope.iv,
                aad: envelope.aad,
                kdfVersion: seedEnvelopeVersions.kdfVersion,
                cipherVersion: seedEnvelopeVersions.cipherVersion,
            }),
            credentials: "include",
        });

        if (!response.ok) {
            console.error(
                "[WalletIframe] Provision request failed with status:",
                response.status,
            );
            clearWallet();
            const errorBody = (await response.json().catch(() => null)) as {
                code?: string;
            } | null;

            console.error("[WalletIframe] Error response body:", errorBody);

            if (response.status === 409) {
                throw new Error(
                    "An embedded wallet already exists for this account.",
                );
            }

            if (
                response.status === 400 &&
                errorBody?.code === "PASSKEY_NOT_FOUND"
            ) {
                throw new Error(
                    "The selected passkey is no longer available for this account.",
                );
            }

            if (response.status === 401) {
                throw new Error(
                    "Your session expired. Sign in again before creating a wallet.",
                );
            }

            throw new Error("Failed to persist the embedded wallet envelope.");
        }

        const result = (await response.json()) as ProvisionResponse;
        console.debug("[WalletIframe] Provision successful, result:", result);

        if (result.response.publicKey !== address) {
            console.error(
                "[WalletIframe] Address mismatch. API returned:",
                result.response.publicKey,
                "Expected:",
                address,
            );
            clearWallet();
            throw new Error(
                "Wallet address mismatch while provisioning the embedded wallet.",
            );
        }

        return address;
    } catch (error) {
        console.error("[WalletIframe] Error during provisionWallet:", error);
        throw error;
    } finally {
        zeroSensitiveBuffer(prfOutput);
        zeroSensitiveBuffer(seedForEnvelope);
        zeroSensitiveBuffer(seedForWallet);
    }
}

export function WalletIframe() {
    const [params, setParams] = useState<WalletIframeParams | null>(null);
    const state = useWalletState();
    const [pendingApproval, setPendingApproval] = useState<{
        tx: string;
        requestId: string;
    } | null>(null);
    const approvalResolveRef = useRef<((approved: boolean) => void) | null>(
        null,
    );
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setParams(parseWalletIframeParams(window.location.search));
        }
    }, []);

    const canProvision = useMemo(
        () =>
            !!params?.userId &&
            !!params?.credentialId &&
            !!params?.passkeyId &&
            params.mode === "provision",
        [params],
    );

    const handleProvision = useCallback(async () => {
        console.debug(
            "[WalletIframe] handleProvision triggered. Params:",
            params,
        );
        if (!params?.userId || !params.credentialId || !params.passkeyId) {
            console.warn("[WalletIframe] Missing provisioning parameters.");
            setError("Missing wallet provisioning parameters");
            return;
        }

        try {
            setStatus("AUTHENTICATING");
            setStatus("DERIVING");
            const address = await provisionWallet({
                userId: params.userId,
                credentialId: params.credentialId,
                passkeyId: params.passkeyId,
            });

            console.debug(
                "[WalletIframe] Provision flow completed successfully. Address:",
                address,
            );
            setStatus("PROVISIONING");
            setAddress(address);
            setStatus("READY");

            sendToParent(createWalletAddressMessage("provision", address));
        } catch (err) {
            console.error("[WalletIframe] handleProvision caught error:", err);
            clearWallet();
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to provision wallet",
            );
        }
    }, [params]);

    useEffect(() => {
        if (state.status !== "READY") {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
            return;
        }

        if (cleanupRef.current) {
            return;
        }

        const cleanup = setupMessageHandlers({
            isWalletReady: () => isWalletReady(),
            onApproveRequest: async (request) => {
                return new Promise((resolve) => {
                    setPendingApproval({
                        tx: request.tx,
                        requestId: request.requestId,
                    });
                    approvalResolveRef.current = resolve;
                });
            },
            signTransaction: async (tx) => signTransaction(tx),
            onError: (error) => {
                console.error("Wallet iframe error:", error);
            },
        });

        cleanupRef.current = cleanup;
        return () => {
            cleanup();
            cleanupRef.current = null;
        };
    }, [state.status]);

    const handleApproveSign = () => {
        if (approvalResolveRef.current) {
            approvalResolveRef.current(true);
            approvalResolveRef.current = null;
            setPendingApproval(null);
        }
    };

    const handleRejectSign = () => {
        if (approvalResolveRef.current) {
            approvalResolveRef.current(false);
            approvalResolveRef.current = null;
            setPendingApproval(null);
        }
    };

    const handleReset = () => {
        clearWallet();
        reset();
    };

    if (!params) {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-8">
                <LoadingCard label="Loading wallet runtime..." />
            </div>
        );
    }

    if (!canProvision) {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-8">
                <Card className="w-full max-w-sm">
                    <CardContent className="pt-6">
                        <p className="text-center text-destructive">
                            Missing wallet provisioning parameters
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (pendingApproval) {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-8">
                <ApprovalUI
                    recipient="Transaction"
                    amount="—"
                    fee="—"
                    onConfirm={handleApproveSign}
                    onReject={handleRejectSign}
                />
            </div>
        );
    }

    if (state.status === "IDLE") {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-8">
                <IdleCard onProvision={handleProvision} />
            </div>
        );
    }

    if (state.status === "AUTHENTICATING") {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-8">
                <LoadingCard label="Authenticating with passkey..." />
            </div>
        );
    }

    if (state.status === "DERIVING") {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-8">
                <LoadingCard label="Generating wallet seed..." />
            </div>
        );
    }

    if (state.status === "PROVISIONING") {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-8">
                <LoadingCard label="Persisting encrypted wallet envelope..." />
            </div>
        );
    }

    if (state.status === "READY" && state.address) {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-8">
                <ReadyCard address={state.address} />
            </div>
        );
    }

    if (state.status === "ERROR") {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-8">
                <ErrorCard
                    error={state.error ?? "Unknown error"}
                    onReset={handleReset}
                />
            </div>
        );
    }

    return null;
}

const IdleCard = memo(function IdleCard({
    onProvision,
}: {
    onProvision: () => void;
}) {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-center">
                    VELA Embedded Wallet
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                    Create your embedded wallet with an existing passkey.
                </p>
                <Button
                    onClick={onProvision}
                    className="w-full"
                    data-testid="connect-passkey"
                >
                    Create wallet with passkey
                </Button>
            </CardContent>
        </Card>
    );
});

const LoadingCard = memo(function LoadingCard({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">{label}</p>
        </div>
    );
});

const ReadyCard = memo(function ReadyCard({ address }: { address: string }) {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-center">
                    Wallet Provisioned
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <p className="text-center text-xs text-muted-foreground">
                        Address
                    </p>
                    <p
                        className="rounded bg-muted p-2 text-center text-xs font-mono break-all"
                        data-testid="iframe-wallet-address"
                    >
                        {address}
                    </p>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                    The encrypted wallet envelope was stored successfully.
                    Unlock and reuse flows come next.
                </p>
            </CardContent>
        </Card>
    );
});

const ErrorCard = memo(function ErrorCard({
    error,
    onReset,
}: {
    error: string;
    onReset: () => void;
}) {
    return (
        <Card className="w-full max-w-sm">
            <CardContent className="space-y-4 pt-6">
                <p className="text-center text-destructive">{error}</p>
                <Button onClick={onReset} className="w-full">
                    Try Again
                </Button>
            </CardContent>
        </Card>
    );
});

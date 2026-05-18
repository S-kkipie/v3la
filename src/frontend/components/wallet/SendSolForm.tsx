"use client";

import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import { useMemo, useState } from "react";

import { Button } from "@/frontend/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/frontend/components/ui/card";
import { EmbeddedWalletClient } from "@/frontend/wallet/client";
import {
    InsufficientBalanceError,
    InvalidAddressError,
    NetworkError,
    WalletNotReadyError,
} from "@/frontend/wallet/errors";

export interface SendSolFormProps {
    fromAddress: string;
    onSuccess: (signature: string) => void;
    onError: (error: Error) => void;
}

type SendState =
    | "idle"
    | "creating"
    | "signing"
    | "submitting"
    | "success"
    | "error";

const DEVNET_RPC_URL = "https://api.devnet.solana.com";
const MIN_SOL_AMOUNT = 0.001;
const EXPLORER_BASE = "https://explorer.solana.com/tx";

function toError(value: unknown): Error {
    if (value instanceof Error) return value;
    return new Error(
        typeof value === "string" ? value : "Unknown transaction error",
    );
}

function isLikelySolanaAddress(value: string): boolean {
    const candidate = value.trim();
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(candidate)) {
        return false;
    }

    try {
        new PublicKey(candidate);
        return true;
    } catch {
        return false;
    }
}

export function SendSolForm({
    fromAddress,
    onSuccess,
    onError,
}: SendSolFormProps) {
    const [recipient, setRecipient] = useState("");
    const [amountSol, setAmountSol] = useState(`${MIN_SOL_AMOUNT}`);
    const [state, setState] = useState<SendState>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [signature, setSignature] = useState<string | null>(null);

    const connection = useMemo(
        () => new Connection(DEVNET_RPC_URL, "confirmed"),
        [],
    );

    const isBusy =
        state === "creating" || state === "signing" || state === "submitting";
    const canSubmit =
        !isBusy &&
        recipient.trim().length > 0 &&
        Number(amountSol) >= MIN_SOL_AMOUNT;

    const statusLabel = {
        idle: "Ready",
        creating: "Creating transaction...",
        signing: "Awaiting iframe approval...",
        submitting: "Submitting to devnet...",
        success: "Success",
        error: "Error",
    }[state];

    const explorerUrl = signature
        ? `${EXPLORER_BASE}/${signature}?cluster=devnet`
        : null;

    const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSignature(null);
        setErrorMessage(null);

        try {
            const normalizedRecipient = recipient.trim();

            if (!isLikelySolanaAddress(fromAddress)) {
                throw new InvalidAddressError(fromAddress);
            }

            if (!isLikelySolanaAddress(normalizedRecipient)) {
                throw new InvalidAddressError(normalizedRecipient);
            }

            const parsedAmount = Number(amountSol);
            if (
                !Number.isFinite(parsedAmount) ||
                parsedAmount < MIN_SOL_AMOUNT
            ) {
                throw new Error(
                    `Amount must be at least ${MIN_SOL_AMOUNT} SOL`,
                );
            }

            const lamports = Math.round(parsedAmount * LAMPORTS_PER_SOL);
            if (lamports <= 0) {
                throw new Error("Amount must convert to at least 1 lamport");
            }

            setState("creating");

            const fromPubkey = new PublicKey(fromAddress);
            const toPubkey = new PublicKey(normalizedRecipient);

            let blockhash: string;
            let lastValidBlockHeight: number;
            try {
                const latestBlockhash =
                    await connection.getLatestBlockhash("confirmed");
                blockhash = latestBlockhash.blockhash;
                lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
            } catch {
                throw new NetworkError(
                    "Unable to reach Solana devnet. Please check your connection and try again.",
                );
            }

            const transaction = new Transaction({
                feePayer: fromPubkey,
                blockhash,
                lastValidBlockHeight,
            }).add(
                SystemProgram.transfer({
                    fromPubkey,
                    toPubkey,
                    lamports,
                }),
            );

            const serializedTx = transaction.serialize({
                verifySignatures: false,
                requireAllSignatures: false,
            });
            const serializedTxBase64 =
                Buffer.from(serializedTx).toString("base64");

            setState("signing");

            const walletClient = new EmbeddedWalletClient();
            const iframe = document.querySelector<HTMLIFrameElement>(
                "iframe[title='VELA Wallet Iframe'], #wallet-iframe",
            );

            if (!iframe) {
                throw new WalletNotReadyError(
                    "Wallet iframe not found. Please connect your wallet first.",
                );
            }

            await walletClient.connect(iframe);
            const signedTxBase64 =
                await walletClient.signTransaction(serializedTxBase64);

            setState("submitting");

            const signedTxBytes = Buffer.from(signedTxBase64, "base64");
            const signedTransaction = Transaction.from(signedTxBytes);

            let txSignature: string;
            try {
                txSignature = await connection.sendRawTransaction(
                    signedTransaction.serialize(),
                    {
                        skipPreflight: false,
                        preflightCommitment: "confirmed",
                        maxRetries: 3,
                    },
                );
            } catch {
                throw new NetworkError(
                    "Failed to submit transaction. Please check your connection and try again.",
                );
            }

            let confirmation: Awaited<
                ReturnType<Connection["confirmTransaction"]>
            >;
            try {
                confirmation = await connection.confirmTransaction(
                    {
                        signature: txSignature,
                        blockhash,
                        lastValidBlockHeight,
                    },
                    "confirmed",
                );
            } catch {
                throw new NetworkError(
                    "Transaction confirmation timed out. Please check the explorer to verify status.",
                );
            }

            if (confirmation.value.err) {
                const errJson = JSON.stringify(confirmation.value.err);
                console.error("Transaction failed:", errJson);
                if (
                    errJson.includes("InsufficientFunds") ||
                    errJson.includes("insufficient funds")
                ) {
                    throw new InsufficientBalanceError();
                }
                throw new Error("Transaction failed. Please try again.");
            }

            setSignature(txSignature);
            setState("success");
            onSuccess(txSignature);
        } catch (error) {
            const normalizedError = toError(error);
            setState("error");
            setErrorMessage(normalizedError.message);
            onError(normalizedError);
        }
    };

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Send SOL</CardTitle>
                <CardDescription>
                    Create a transfer, approve in the embedded wallet iframe,
                    and submit to Solana devnet.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSend} className="space-y-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="sol-recipient"
                            className="text-sm font-medium"
                        >
                            Recipient address
                        </label>
                        <input
                            id="sol-recipient"
                            name="recipient"
                            type="text"
                            placeholder="Recipient base58 address"
                            value={recipient}
                            onChange={(event) =>
                                setRecipient(event.target.value)
                            }
                            data-testid="recipient-input"
                            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            disabled={isBusy}
                            required
                        />
                        {recipient.trim().length > 0 &&
                            !isLikelySolanaAddress(recipient) && (
                                <p className="text-xs text-destructive">
                                    Enter a valid Solana base58 address (32-44
                                    chars).
                                </p>
                            )}
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="sol-amount"
                            className="text-sm font-medium"
                        >
                            Amount (SOL)
                        </label>
                        <input
                            id="sol-amount"
                            name="amount"
                            type="number"
                            inputMode="decimal"
                            min={MIN_SOL_AMOUNT}
                            step="0.001"
                            value={amountSol}
                            onChange={(event) =>
                                setAmountSol(event.target.value)
                            }
                            data-testid="amount-input"
                            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            disabled={isBusy}
                            required
                        />
                    </div>

                    <div
                        className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
                        data-testid="status-label"
                    >
                        <span className="font-medium">Status:</span>{" "}
                        {statusLabel}
                    </div>

                    {errorMessage && (
                        <p
                            className="text-sm text-destructive"
                            data-testid="error-message"
                        >
                            {errorMessage}
                        </p>
                    )}

                    {signature && explorerUrl && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            Transaction confirmed:{" "}
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-2"
                            >
                                View on Solana Explorer
                            </a>
                        </p>
                    )}

                    <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="w-full"
                        data-testid="send-button"
                    >
                        {isBusy ? "Processing..." : "Send"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

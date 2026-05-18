"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { memo } from "react";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { Button } from "@/frontend/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/frontend/components/ui/card";

export interface ApprovalUIProps {
    recipient: string;
    amount: string;
    fee: string;
    onConfirm: () => void;
    onReject: () => void;
    isLoading?: boolean;
}

function truncateAddress(address: string): string {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const ApprovalUICore = memo(function ApprovalUI({
    recipient,
    amount,
    fee,
    onConfirm,
    onReject,
    isLoading = false,
}: ApprovalUIProps) {
    return (
        <Card
            className="w-full max-w-sm mx-auto"
            role="dialog"
            aria-label="Confirm Transaction"
        >
            <CardHeader>
                <CardTitle className="text-center text-lg">
                    Confirm Transaction
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Recipient</span>
                        <span
                            className="font-mono font-medium"
                            data-testid="recipient-address"
                        >
                            {truncateAddress(recipient)}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-medium" data-testid="amount">
                            {amount} SOL
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            Network Fee
                        </span>
                        <span className="font-medium" data-testid="fee">
                            {fee} SOL
                        </span>
                    </div>
                </div>

                {/* Warning */}
                <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertDescription>
                        This action cannot be undone.
                    </AlertDescription>
                </Alert>
            </CardContent>

            <CardFooter className="flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onReject}
                    disabled={isLoading}
                    aria-label="Reject transaction"
                    data-testid="reject-transaction"
                >
                    Reject
                </Button>

                <Button
                    variant="default"
                    className="flex-1"
                    onClick={onConfirm}
                    disabled={isLoading}
                    aria-label="Confirm transaction"
                    data-testid="confirm-transaction"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Confirming...
                        </>
                    ) : (
                        "Confirm"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
});

export { ApprovalUICore as ApprovalUI };

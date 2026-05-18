"use client";

import { memo } from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { authenticateAndGetPrf } from "./webauthn-prf";
import { deriveWallet, isWalletReady, signTransaction } from "./key-derivation";
import { setupMessageHandlers, sendToParent } from "./messaging";
import { MessageType } from "../protocol";
import {
  useWalletState,
  setStatus,
  setAddress,
  setError,
  reset,
} from "./state";
import { ApprovalUI } from "./components/ApprovalUI";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";

function createWalletAddressMessage(requestId: string, address: string) {
  return {
    protocol: "vela-wallet:v1",
    type: MessageType.WALLET_ADDRESS,
    requestId,
    address,
  };
}

export function WalletIframe() {
  const [userId, setUserId] = useState<string | null>(null);
  const state = useWalletState();
  const [pendingApproval, setPendingApproval] = useState<{
    tx: string;
    requestId: string;
  } | null>(null);
  const approvalResolveRef = useRef<((approved: boolean) => void) | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setUserId(params.get("userId"));
    }
  }, []);

  const handleConnect = useCallback(async () => {
    if (!userId) {
      setError("No userId provided");
      return;
    }

    try {
      setStatus("AUTHENTICATING");
      const prfOutput = await authenticateAndGetPrf(userId);

      setStatus("DERIVING");
      const address = deriveWallet(userId, prfOutput);

      setStatus("READY");
      setAddress(address);

      sendToParent(createWalletAddressMessage("init", address));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  }, [userId]);

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
          setPendingApproval({ tx: request.tx, requestId: request.requestId });
          approvalResolveRef.current = resolve;
        });
      },
      signTransaction: async (tx) => {
        return signTransaction(tx);
      },
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

  if (!userId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              Missing userId parameter
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
        <IdleCard onConnect={handleConnect} />
      </div>
    );
  }

  if (state.status === "AUTHENTICATING") {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <AuthenticatingCard />
      </div>
    );
  }

  if (state.status === "DERIVING") {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <DerivingCard />
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
        <ErrorCard error={state.error ?? "Unknown error"} onReset={reset} />
      </div>
    );
  }

  return null;
}

const IdleCard = memo(function IdleCard({
  onConnect,
}: {
  onConnect: () => void;
}) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center">VELA Embedded Wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Connect your wallet using your passkey
        </p>
        <Button
          onClick={onConnect}
          className="w-full"
          data-testid="connect-passkey"
        >
          Connect with Passkey
        </Button>
      </CardContent>
    </Card>
  );
});

const AuthenticatingCard = memo(function AuthenticatingCard() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">Authenticating with passkey...</p>
    </div>
  );
});

const DerivingCard = memo(function DerivingCard() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">Deriving wallet...</p>
    </div>
  );
});

const ReadyCard = memo(function ReadyCard({ address }: { address: string }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center">Wallet Connected</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground text-center">Address</p>
          <p
            className="text-xs font-mono break-all text-center bg-muted p-2 rounded"
            data-testid="iframe-wallet-address"
          >
            {address}
          </p>
        </div>
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
      <CardContent className="pt-6 space-y-4">
        <p className="text-center text-destructive">{error}</p>
        <Button onClick={onReset} className="w-full">
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
});

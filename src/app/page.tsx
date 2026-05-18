"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { EmbeddedWalletButton } from "@/frontend/components/wallet/EmbeddedWalletButton";
import { EmbeddedWalletClient } from "@/frontend/wallet/client";
import { authClient } from "@/frontend/auth/auth";

export default function Home() {
  const { connectors, connect, disconnect, wallet, status } =
    useWalletConnection();

  const [embeddedConnected, setEmbeddedConnected] = useState(false);
  const [embeddedAddress, setEmbeddedAddress] = useState<string | null>(null);
  const [embeddedConnecting, setEmbeddedConnecting] = useState(false);
  const [embeddedError, setEmbeddedError] = useState<string | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeUserId, setIframeUserId] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const walletClientRef = useRef<EmbeddedWalletClient | null>(null);

  const preconnectIframe = useCallback(async () => {
    if (showIframe || iframeRef.current) return;
    try {
      const session = await authClient.getSession();
      const userId = session.data?.user?.id;
      if (userId) setIframeUserId(userId);
    } catch {
      /* silent - connect button handles fallback */
    }
  }, [showIframe]);

  useEffect(() => {
    walletClientRef.current = new EmbeddedWalletClient();
    return () => {
      walletClientRef.current?.disconnect();
    };
  }, []);

  const handleEmbeddedConnect = async () => {
    setEmbeddedError(null);
    setEmbeddedConnecting(true);

    try {
      const session = await authClient.getSession();
      const userId = session.data?.user?.id;

      if (!userId) {
        setEmbeddedError("Please sign in with Better Auth first");
        setEmbeddedConnecting(false);
        return;
      }

      setIframeUserId(userId);
      setShowIframe(true);
    } catch (error) {
      console.error("Failed to get session:", error);
      setEmbeddedError(
        error instanceof Error ? error.message : "Failed to get user session",
      );
      setEmbeddedConnecting(false);
    }
  };

  useEffect(() => {
    if (
      showIframe &&
      iframeRef.current &&
      walletClientRef.current &&
      iframeUserId
    ) {
      walletClientRef.current
        .connect(iframeRef.current)
        .then((address) => {
          setEmbeddedAddress(address);
          setEmbeddedConnected(true);
          setEmbeddedConnecting(false);
          setEmbeddedError(null);
        })
        .catch((error) => {
          console.error("Failed to connect embedded wallet:", error);
          setEmbeddedError(
            error instanceof Error ? error.message : "Failed to connect wallet",
          );
          setEmbeddedConnecting(false);
        });
    }
  }, [showIframe, iframeUserId]);

  const handleEmbeddedDisconnect = () => {
    walletClientRef.current?.disconnect();
    setEmbeddedConnected(false);
    setEmbeddedAddress(null);
    setShowIframe(false);
    setIframeUserId(null);
    setEmbeddedError(null);
  };

  const address = wallet?.account.address.toString();

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col gap-10 border-x border-border px-6 py-16">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            Solana starter kit
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Ship a Solana dapp fast
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-muted">
            Drop in <code className="font-mono">@solana/react-hooks</code>, wrap
            your tree once, and you get wallet connect/disconnect plus
            ready-to-use hooks for balances and transactions—no manual RPC
            wiring.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            <li className="flex gap-2">
              <span
                className="mt-1.5 h-2 w-2 rounded-full bg-foreground/60"
                aria-hidden
              />
              <div>
                <a
                  className="font-medium underline underline-offset-2"
                  href="https://solana.com/docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  Solana docs
                </a>{" "}
                — core concepts, RPC, programs, and client patterns.
              </div>
            </li>
            <li className="flex gap-2">
              <span
                className="mt-1.5 h-2 w-2 rounded-full bg-foreground/60"
                aria-hidden
              />
              <div>
                <a
                  className="font-medium underline underline-offset-2"
                  href="https://www.anchor-lang.com/docs/introduction"
                  target="_blank"
                  rel="noreferrer"
                >
                  Anchor docs
                </a>{" "}
                — build and test programs with IDL, macros, and type-safe
                clients.
              </div>
            </li>
            <li className="flex gap-2">
              <span
                className="mt-1.5 h-2 w-2 rounded-full bg-foreground/60"
                aria-hidden
              />
              <div>
                <a
                  className="font-medium underline underline-offset-2"
                  href="https://faucet.solana.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Solana faucet (devnet)
                </a>{" "}
                — grab free devnet SOL to try transfers and transactions.
              </div>
            </li>
            <li className="flex gap-2">
              <span
                className="mt-1.5 h-2 w-2 rounded-full bg-foreground/60"
                aria-hidden
              />
              <div>
                <a
                  className="font-medium underline underline-offset-2"
                  href="https://github.com/solana-foundation/framework-kit/tree/main/packages/react-hooks"
                  target="_blank"
                  rel="noreferrer"
                >
                  @solana/react-hooks README
                </a>{" "}
                — how this starter wires the client, connectors, and hooks.
              </div>
            </li>
          </ul>
        </header>

        <section className="w-full max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.35)]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-lg font-semibold">External Wallets</p>
              <p className="text-sm text-muted">
                Connect using Phantom, Solflare, or another browser extension.
              </p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground/80">
              {status === "connected" ? "Connected" : "Not connected"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect(connector.id)}
                disabled={status === "connecting"}
                className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex flex-col">
                  <span className="text-base">{connector.name}</span>
                  <span className="text-xs text-muted">
                    {status === "connecting"
                      ? "Connecting…"
                      : status === "connected" &&
                          wallet?.connector.id === connector.id
                        ? "Active"
                        : "Tap to connect"}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full bg-muted transition group-hover:bg-primary/80"
                />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 text-sm">
            <span className="rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs">
              {address ?? "No wallet connected"}
            </span>
            <button
              onClick={() => disconnect()}
              disabled={status !== "connected"}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 font-medium transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Disconnect
            </button>
          </div>
        </section>

        <section className="w-full max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.35)]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-lg font-semibold">Embedded Wallet</p>
              <p className="text-sm text-muted">
                Passkey-based wallet secured by WebAuthn. No browser extension
                required.
              </p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground/80">
              {embeddedConnected ? "Connected" : "Not connected"}
            </span>
          </div>

          {embeddedError && (
            <p className="text-sm text-destructive">{embeddedError}</p>
          )}

          {showIframe && iframeUserId && (
            <iframe
              ref={iframeRef}
              src={`/wallet/iframe?userId=${encodeURIComponent(iframeUserId)}`}
              sandbox="allow-scripts allow-same-origin"
              title="VELA Wallet Iframe"
              data-testid="wallet-iframe"
              className="w-full h-[400px] rounded-xl border border-border bg-background"
            />
          )}

          <div className="flex flex-col gap-3">
            <EmbeddedWalletButton
              onConnect={handleEmbeddedConnect}
              onDisconnect={handleEmbeddedDisconnect}
              isConnected={embeddedConnected}
              isConnecting={embeddedConnecting}
              address={embeddedAddress}
              onMouseEnter={preconnectIframe}
            />

            {embeddedConnected && (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
                disabled
                title="Send SOL - Coming in Task 16"
                data-testid="send-sol-button"
              >
                Send SOL
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

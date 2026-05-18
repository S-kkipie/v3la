"use client";

export default function WalletPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">VELA Wallet</h1>
        <p className="text-sm text-muted">
          Secure wallet operations run in an isolated iframe.
        </p>
        <iframe
          id="wallet-iframe"
          src="/wallet/iframe"
          sandbox="allow-scripts"
          title="VELA Wallet"
          width="100%"
          height="600px"
          className="rounded-xl border border-border bg-background"
        />
      </div>
    </div>
  );
}

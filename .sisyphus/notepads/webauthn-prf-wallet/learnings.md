# Learnings - WebAuthn PRF Wallet

## Conventions

- Use `"use client"` for all iframe components (no SSR crypto code)
- Wallet code lives in `src/frontend/wallet/` directory
- Iframe-specific code in `src/frontend/wallet/iframe/`
- UI components in `src/frontend/components/wallet/`
- Use shadcn/ui components for consistency
- postMessage protocol version: `vela-wallet:v1`

## Patterns

- Better Auth passkey plugin: `extensions: { credProps: true, prf: true }`
- HKDF-SHA256 for Ed25519 seed derivation from PRF output
- Buffer zeroing after key derivation for security
- Origin validation on every postMessage handler
- requestId correlation for anti-replay

## Gotchas

- PRF must be requested at registration time (existing passkeys can't retroactively gain PRF)
- Chrome 132+ required for PRF support
- Same-origin iframe still allows parent to access iframe's window (defense in depth needed)
- `@noble/hashes/hkdf` import path may need `.js` extension
- Better Auth `@better-auth/passkey` v1.6.11 `PasskeyExtensionsResolver` type doesn't include `prf` property
- TypeScript workaround: cast extensions object as `Record<string, boolean>` to bypass strict type checking

## Decisions

- Iframe in same app (not subdomain) for MVP simplicity
- SOL only (no SPL tokens) for MVP
- No recovery flow for MVP (lost passkey = lost wallet)
- Coexist with existing Phantom/Solflare connectors

## Implementation

- `/wallet` route: client-only page with iframe pointing to `/wallet/iframe`
- `/wallet/iframe` route: client-only page rendering WalletIframe component
- Iframe sandbox: `allow-scripts` (no `allow-same-origin` for security)
- All routes use `"use client"` directive

## Protocol (postMessage)

- All messages include `protocol: "vela-wallet:v1"`, `type`, and `requestId`
- Messages extend BaseMessage but Zod schemas omit protocol (parent validates separately)
- `createSignRequest()` includes protocol field automatically
- `parseMessage()` validates: (1) is object, (2) protocol version, (3) message type, (4) Zod schema
- Zod schemas use `.extend()` on BaseMessageSchema, NOT `.omit()` for protocol

## Key Derivation

- `key-derivation.ts` must store keypair in module closure (`let derivedKeypair`), never on `window` or in storage
- `deriveWallet` zeros PRF output after derivation (defense in depth even though `prf-solana.ts` also zeros the seed)
- `signTransaction` returns base64-encoded signed transaction (not just the raw Ed25519 signature)
- Node REPL tests can bypass ESM module cache by appending `?t=N` to dynamic import paths, enabling determinism tests with fresh module state
- `Buffer` is polyfilled by Next.js bundler, so it's safe to use in wallet iframe code for base64 encoding

## EmbeddedWalletClient (Task 11)

- Docstrings on public API methods are necessary for consumer documentation (throws types, return types)
- Inline comments for non-obvious logic (origin validation, request correlation)
- Error classes exportable for consumer error handling (`WalletError`, `TimeoutError`, `UserRejectedError`, `WalletNotReadyError`)
- requestId generation: `${Date.now()}-${random}` for simple unique IDs without crypto依赖
- Pending request map pattern: resolve/reject stored with timeout, cleared on response or timeout

## Embedded Wallet UI Components (Task 14)

- Base UI tooltip API: `Tooltip.Provider` uses `delay` (not `delayDuration`), `Tooltip.Root` has no delay prop
- Base UI tooltip structure: `Tooltip.Root` > `Tooltip.Trigger` + `Tooltip.Positioner` > `Tooltip.Popup`
- Base UI `Tooltip.Trigger` uses `render` prop (not `asChild`) for custom elements
- Badge component needed `success`/`warning` variants for wallet status (emerald/amber with oklch-transparent backgrounds)
- All wallet UI components use `"use client"` directive
- shadcn/ui pattern: `data-slot` attributes on all component wrappers for styling hooks

## WalletStatus Component (Wave 3, Task 14)

- `useDisconnectWallet()` returns `() => Promise<void>` directly, NOT `{ disconnect }`
- Base UI Button does NOT support `asChild` prop (unlike Radix UI shadcn)
- Base UI TooltipTrigger does NOT support `asChild` prop
- Use `window.open()` for external links instead of `<a>` with `asChild`
- Pre-existing TS errors in `tooltip.tsx` from shadcn generator (Base UI type mismatch on `delay` prop and `Tooltip.Popup` render type) — not blocking build
- `useBalance(address)` returns `{ lamports, fetching, slot }` — lamports is `bigint | null | undefined`
- Explorer URL format: `https://explorer.solana.com/address/{address}?cluster=devnet`

## Task 12 - Wallet-Auth Integration (verified complete)

### Flow

1. Parent `page.tsx`: `authClient.getSession()` → `session.data?.user?.id`
2. userId passed via query param: `/wallet/iframe?userId=<id>`
3. `WalletIframe.tsx`: reads userId, calls `authenticateAndGetPrf(userId)`, derives wallet, sends `WALLET_ADDRESS` postMessage
4. `EmbeddedWalletClient.connect()` listens for WALLET_ADDRESS, resolves with address
5. Parent displays address via `EmbeddedWalletButton`, clears state on disconnect

### Verification

- Build: `npm run build` exits 0, zero LSP diagnostics
- All files: `page.tsx`, `client.ts`, `WalletIframe.tsx`, `iframe/page.tsx` — clean
- Existing Phantom/Solflare connectors preserved (separate section)
- No private key or seed stored in parent state (only `address: string | null` and `connected: boolean`)

## Task 17 - Test Infrastructure Setup

### Dependencies Installed

- `playwright` v1.60.0
- `@playwright/test` v1.60.0
- `vitest` v4.1.6
- `@vitest/ui` v4.1.6
- `jsdom` v29.1.1 (required for vitest environment)

### Files Created

- `playwright.config.ts` - Test directory `./tests`, baseURL `http://localhost:3000`, projects for chromium/firefox/webkit, webServer with `bun run dev`
- `vitest.config.ts` - Includes `src/**/*.test.ts` and `src/**/*.test.tsx`, excludes `tests/` and `e2e/`, environment `jsdom`
- `src/frontend/crypto/prf-solana.test.ts` - 11 tests for PRF wallet derivation (salt, seed, keypair)

### Scripts Added to package.json

- `"test": "vitest run && playwright test"` (combined)
- `"test:unit": "vitest"` (watch mode)
- `"test:unit:run": "vitest run"` (CI-friendly)
- `"test:unit:ui": "vitest --ui"` (UI mode)
- `"test:e2e": "playwright test"` (CLI)
- `"test:e2e:ui": "playwright test --ui"` (UI mode)

### Verification

- `bun run test:unit:run` passes: 11 tests, 1 file
- Zero LSP diagnostics on both config files
- Playwright Chromium browser downloaded successfully

## Task 16 - SendSolForm SOL transfer flow

- `EmbeddedWalletClient.signTransaction()` returns a base64-encoded fully signed transaction blob, so parent must deserialize with `Transaction.from(Buffer.from(base64, "base64"))` before submit.
- Parent transfer flow works as: `getLatestBlockhash` -> `SystemProgram.transfer` -> serialize unsigned tx (`requireAllSignatures: false`) -> iframe sign -> `sendRawTransaction` + `confirmTransaction`.
- Explorer success links for devnet tx signatures use: `https://explorer.solana.com/tx/{signature}?cluster=devnet`.

## Task 19 - Playwright e2e Tests for postMessage Protocol

### Tests Created

- `tests/wallet-protocol.spec.ts` with 6 test cases covering the full protocol surface

### Test Strategy

- **WebAuthn mocking via `page.addInitScript()`**: Inject `PublicKeyCredential.getClientCapabilities` and `navigator.credentials.get` mocks before page scripts run. This lets the wallet reach READY state without a real authenticator.
- **Message collector pattern**: Attach a `message` listener in page context that pushes to `window.__testMessages`, enabling test code to inspect postMessage traffic after the fact.
- **`__testSent` flag**: Add a sentinel field to all outgoing test messages so the collector can distinguish sent vs received messages. Essential because `window.postMessage` to same origin is also captured by the listener.
- **`page.evaluate` argument passing**: When the page function destructures `{ requestId }`, the argument must be an object `{ requestId }`, not the bare string. Passing a bare string causes `requestId` to be `undefined` inside the page.

### Test Cases

1. **Valid sign request round-trip**: Mock WebAuthn → connect wallet → send WALLET_SIGN → click Confirm → assert WALLET_SIGN_RESPONSE or WALLET_SIGN_ERROR with matching requestId.
2. **Invalid origin ignored**: Dispatch synthetic `MessageEvent` with `origin: "https://evil.com"` → assert no response.
3. **Malformed message rejected**: Send message without `protocol` field → assert no response.
4. **Unknown protocol version rejected**: Send `protocol: "vela-wallet:v2"` → assert no response.
5. **Timeout handling**: Send WALLET_SIGN but never click Confirm → wait 30s → assert WALLET_SIGN_ERROR with `"Timeout"`. Test timeout bumped to 60s to accommodate iframe's 30s timer + setup overhead.
6. **WALLET_READY handshake**: Send WALLET_READY → assert response with `ready: true` and matching requestId.

### Environment Notes

- Chromium and Firefox browsers run successfully in this environment.
- WebKit requires system libraries (`libgtk-4`, `libevent`, GStreamer, etc.) not installed in the container. Tests skip WebKit via `test.skip(({ browserName }) => browserName === "webkit", ...)` rather than failing.
- `bun run test:e2e tests/wallet-protocol.spec.ts` exits 0 with 12 passed, 6 skipped.

## Task 21 - Comprehensive Error Handling

### Files Created

- `src/frontend/wallet/errors.ts` - Typed error class hierarchy with user-friendly messages
- `src/frontend/wallet/errors.test.ts` - 15 unit tests covering all error classes

### Files Modified

- `src/frontend/wallet/iframe/webauthn-prf.ts` - Replaced generic Error throws with `PrfNotSupportedError` and `UserRejectedError`
- `src/frontend/wallet/client.ts` - Imported errors from `errors.ts`, updated messages to be user-friendly
- `src/frontend/components/wallet/SendSolForm.tsx` - Added `InvalidAddressError`, `InsufficientBalanceError`, `NetworkError`, `WalletNotReadyError` handling

### Error Classes

- `WalletError` (base) - All wallet errors extend this
- `PrfNotSupportedError` - Browser/authenticator lacks WebAuthn PRF support
- `TimeoutError` - Request to iframe timed out
- `UserRejectedError` - User cancelled prompt or rejected transaction
- `WalletNotReadyError` - Iframe not loaded or not ready
- `InvalidAddressError` - Malformed Solana address
- `InsufficientBalanceError` - Not enough SOL for transaction
- `NetworkError` - RPC or network failure

### Patterns

- All error messages are user-friendly (no stack traces, no raw error codes)
- Errors are still logged to console for debugging via `console.error`
- `mapWebAuthnError` maps DOMException names to typed errors:
  - `NotAllowedError` → `UserRejectedError`
  - `NotSupportedError` → `PrfNotSupportedError`
  - `AbortError` → `UserRejectedError`
- Network operations in `SendSolForm` wrapped with try/catch that converts to `NetworkError`
- Insufficient funds detected by checking confirmation error JSON for "InsufficientFunds" or "insufficient funds"

### Verification

- Build: `npm run build` exits 0
- Tests: `bun run test:unit:run src/frontend/wallet/errors.test.ts` - 15/15 passed
- LSP diagnostics: zero errors on all modified files


## F4 Scope Fidelity Audit (2026-05-17)

- Source-level guardrails check: no EIP-1193 connector usage, no server-side PRF derivation, no key persistence in browser storage, no SPL-token flow in embedded wallet path.
- Existing external connector path still present ( +  in ), embedded wallet added as additional section.
- Scope-risk findings: repo includes broad unrelated modifications/untracked files outside WebAuthn wallet scope (skills docs, README, global config/style files).
- Scope-risk findings: new Drizzle migration artifacts (, meta snapshot/journal) indicate DB-table work present in branch despite scope guardrail against schema expansion for this feature.
- Task 19 marked "skipped" in plan text but  exists; status metadata and implementation footprint are inconsistent and should be reconciled.


## F4 Scope Fidelity Audit (2026-05-17)

- Source-level guardrails check: no EIP-1193 connector usage, no server-side PRF derivation, no key persistence in browser storage, no SPL-token flow in embedded wallet path.
- Existing external connector path still present (useWalletConnection + connectors.map in src/app/page.tsx), embedded wallet added as additional section.
- Scope-risk findings: repo includes broad unrelated modifications/untracked files outside WebAuthn wallet scope (skills docs, README, global config/style files).
- Scope-risk findings: new Drizzle migration artifacts (drizzle/0000_old_inhumans.sql, meta snapshot/journal) indicate DB-table work present in branch despite scope guardrail against schema expansion for this feature.
- Task 19 marked skipped in plan text but tests/wallet-signing.spec.ts exists; status metadata and implementation footprint are inconsistent and should be reconciled.

- F4 rerun: wallet-related changed files limited to src/frontend/providers/providers.tsx and src/frontend/clients/solana-client.ts; no recovery/EIP-1193/SPL/subdomain/server-derivation/key-persistence signals in changed wallet scope.

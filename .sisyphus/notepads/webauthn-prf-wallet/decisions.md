# Decisions - WebAuthn PRF Wallet

## Architecture Decisions

1. **Iframe in same app (Option B)**: Simpler deploy, less CORS complexity. Trade-off: less isolation than subdomain.
2. **No recovery flow for MVP**: Security vs UX trade-off. Recovery adds massive complexity (social recovery, encrypted backups).
3. **SOL only, no SPL tokens**: Reduces scope. SPL tokens require ATA creation, token program integration.
4. **Coexist with external wallets**: Embedded wallet is an additional option, not a replacement.
5. **No key persistence**: Re-derive on every iframe load. Trade-off: UX friction (requires WebAuthn touch each time) vs maximum security.
6. **Approval UI in iframe**: Critical security requirement. No blind signing allowed.
7. **Parent simulates transactions**: Iframe only signs, doesn't simulate. Parent handles RPC calls.

## Technical Decisions

1. **Playwright for e2e tests**: Better for iframe testing, cross-browser support.
2. **Vitest for unit tests**: Fast, modern, works well with Vite/Next.js.
3. **Zod for message validation**: Type-safe runtime validation for postMessage protocol.
4. **App-specific salt strings**: Using `"vela"` prefix instead of generic `"your-app"`.

## Security Decisions

1. **Buffer zeroing after derivation**: Clear PRF output and seed from memory immediately.
2. **No key material in global scope**: Keypair stored in module closure, not window object.
3. **CSP strict for wallet route**: No inline scripts, no eval.
4. **Sandbox iframe**: `allow-scripts` only, no `allow-same-origin` if using srcdoc.

## Key Derivation Decisions

- Double buffer zeroing: `deriveWallet` zeros the PRF ArrayBuffer after calling `deriveWalletFromPrf`, which itself zeros the internal seed. This provides defense in depth.
- Determinism verified via dynamic import cache-busting in tests: same userId + same PRF output always yields the same base58 address.
- `signTransaction` deserializes a base64 transaction, signs with the closure-held keypair, and returns the serialized signed transaction as base64. Private key is never exposed.

## Test Infrastructure Decisions

1. **Playwright over Cypress**: Better iframe support, cross-browser testing, and trace viewer for debugging.
2. **Vitest over Jest**: Modern ESM-native test runner, faster execution, Vite integration.
3. **jsdom environment for unit tests**: Provides DOM APIs for testing React components, lightweight alternative to browser.
4. **`--ui` mode for vitest**: Optional UI mode via `@vitest/ui` for visual test exploration.
5. **Example test in `src/frontend/crypto/`**: Tests live next to source code (`.test.ts` suffix), not in separate `tests/` directory (which is reserved for e2e).

## Task 16 Decisions

- `SendSolForm` builds and submits via `@solana/web3.js` `Connection` to explicit devnet RPC (`https://api.devnet.solana.com`) for deterministic transfer behavior.
- The component performs recipient validation with both base58 length/charset regex and `new PublicKey(...)` parse check before transaction creation.
- For iframe wallet access, form resolves existing iframe in DOM (`iframe[title='VELA Wallet Iframe']` fallback `#wallet-iframe`) and requests signing through `EmbeddedWalletClient` to preserve approval UI requirement.

## Task 19 Decisions

- **Skip WebKit in e2e tests when system deps missing**: Using `test.skip()` in the spec file based on `browserName` is cleaner than modifying shared `playwright.config.ts`. This keeps environment-specific workarounds scoped to the test file.
- **Mock WebAuthn at browser API level, not module level**: `page.addInitScript()` intercepts `navigator.credentials.get` and `PublicKeyCredential.getClientCapabilities` before any app code executes. This avoids brittle module-interception strategies and works across browsers.
- **Sentinel field for message deduplication**: The `__testSent: true` field on outgoing messages avoids counting test-injected messages as iframe responses. Zod strips extra keys by default, so this doesn't break protocol validation.

## 2026-05-17 — F1 Plan Compliance Audit

- **Decision:** APPROVE the implementation against the plan.
- **Rationale:** All 7 Must Haves implemented, all 8 Must NOT Haves absent, all 15 plan checklist items present, build passes with zero errors, security audit 10/10.
- **Minor gaps noted:** Missing per-task evidence files (process/documentation gap only), parent client allows null origin in dev (LOW security concern, documented).

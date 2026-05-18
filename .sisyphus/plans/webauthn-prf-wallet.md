# Plan: WebAuthn PRF Embedded Wallet for Solana

## TL;DR

> **Quick Summary**: Implement a non-custodial embedded wallet for Solana using WebAuthn PRF (Passkey) + Better Auth, hosted in an isolated iframe within the same Next.js app. Zero fees, deterministic Ed25519 key derivation, end-to-end transaction signing.
>
> **Deliverables**:
>
> - PRF-enabled Better Auth passkey configuration
> - Iframe wallet component (`/wallet` route) with WebAuthn PRF key derivation
> - postMessage protocol between parent app and wallet iframe
> - Transaction approval UI inside iframe
> - Better Auth integration (wallet linked to authenticated user)
> - End-to-end signing flow: create tx → iframe signs → submit to devnet
> - Playwright e2e tests for postMessage protocol and signing flow
>
> **Estimated Effort**: Medium-Large (5 waves, ~15 tasks)
> **Parallel Execution**: YES - 4-5 tasks per wave
> **Critical Path**: Fix PRF config → Iframe wallet → postMessage protocol → Parent integration → E2E signing → QA

---

## Context

### Original Request

Implementar una embedded wallet para Solana usando WebAuthn PRF + Better Auth, siguiendo el artículo de 1Shot API, en la misma app (iframe route), MVP funcional de punta a punta.

### Interview Summary

**Key Discussions**:

- Arquitectura: Iframe en misma app (Opción B), ruta dedicada `/wallet`
- Scope MVP: Core wallet funcional (passkey → derivar wallet → sign tx)
- Out of scope: Recovery flow, EIP-1193 connector, SPL tokens, subdominio isolation
- Solana: Solo SOL nativo para MVP

**Research Findings**:

- **BLOCKER**: Better Auth passkey plugin NO tiene PRF habilitado (`prf: true` faltante)
- `prf-solana.ts` tiene HKDF correcto pero está incompleto (sin WebAuthn integration, salt huérfano, strings placeholder)
- Infra de tests: ZERO (no vitest, no playwright, no configs)
- Seguridad: Necesita origin validation, requestId correlation, buffer zeroing, approval UI

### Metis Review

**Identified Gaps** (addressed):

- **Gap: PRF not enabled** → Task 1: Fix Better Auth config
- **Gap: prf-solana.ts incomplete** → Task 2: Complete derivation utility
- **Gap: No WebAuthn PRF client code** → Task 5: Implement in iframe
- **Gap: No iframe infrastructure** → Task 3: Create iframe route + sandbox
- **Gap: No postMessage protocol** → Task 4: Define protocol + types
- **Gap: Security (buffer clearing, approval UI)** → Tasks 5, 7, 9
- **Gap: No tests** → Tasks 10-11: Setup Playwright + e2e tests

---

## Work Objectives

### Core Objective

Build a fully functional WebAuthn PRF-based embedded Solana wallet within the existing Next.js + Better Auth application, where the wallet deterministically derives an Ed25519 keypair from the user's passkey PRF output and can sign SOL transactions via an isolated iframe communicating via postMessage.

### Concrete Deliverables

- `src/server/auth/auth.ts` — Updated with `prf: true` in passkey extensions
- `src/frontend/crypto/prf-solana.ts` — Fixed: connected salt, app-specific strings, buffer clearing
- `src/frontend/wallet/iframe/` — Wallet iframe route + component
- `src/frontend/wallet/protocol.ts` — postMessage protocol types + validation
- `src/frontend/wallet/client.ts` — Parent app postMessage client
- `src/frontend/components/wallet/` — Wallet UI components (connect, sign, status)
- `src/app/wallet/page.tsx` — Iframe route (client-only)
- Playwright e2e tests — postMessage protocol + end-to-end signing

### Definition of Done

- [ ] User can register a passkey with PRF enabled
- [ ] Wallet iframe derives same Solana address on every load
- [ ] Parent app can request transaction signing via postMessage
- [ ] Iframe shows approval UI before signing
- [ ] Signed transaction submits successfully to Solana devnet
- [ ] Playwright tests pass for happy path + error cases
- [ ] Security audit passes (origin validation, buffer clearing, no key exposure)

### Must Have

- PRF-enabled passkey registration and authentication
- Deterministic Ed25519 keypair derivation from PRF output
- Iframe isolation with sandbox attributes
- Versioned postMessage protocol with origin validation
- Transaction approval UI in iframe (no blind signing)
- Buffer zeroing after key derivation
- Coexistence with existing Phantom/Solflare connectors

### Must NOT Have (Guardrails)

- NO recovery flow (lost passkey = lost wallet for MVP)
- NO EIP-1193 connector
- NO SPL token support
- NO subdomain isolation (same-origin only)
- NO transaction simulation inside iframe (parent simulates)
- NO key material persistence (localStorage, sessionStorage, IndexedDB)
- NO server-side wallet derivation
- NO replacement of existing wallet connectors

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed.

### Test Decision

- **Infrastructure exists**: NO
- **Automated tests**: Tests-after (setup Playwright + write e2e tests after implementation)
- **Framework**: Playwright (e2e) + vitest (unit)
- **If tests-after**: Tasks 10-11 set up test infra and write tests after core implementation

### QA Policy

Every task MUST include agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Playwright - Navigate, interact, assert DOM, screenshot
- **API/Backend**: Bash (curl) - Send requests, assert status + response fields
- **Crypto/Wallet**: Bash (node REPL) - Derive keypair, verify deterministic, sign/verify

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - Fix Blockers + Scaffolding):
├── Task 1: Enable PRF in Better Auth passkey config [quick]
├── Task 2: Fix prf-solana.ts (salt, strings, security) [quick]
├── Task 3: Create iframe wallet route + sandbox config [quick]
├── Task 4: Define postMessage protocol (types + validation) [quick]
└── Task 5: Add CSP headers + security config [quick]

Wave 2 (Core Iframe Wallet - MAX PARALLEL):
├── Task 6: WebAuthn PRF integration in iframe [deep]
├── Task 7: Key derivation + buffer clearing in iframe [unspecified-high]
├── Task 8: Transaction approval UI in iframe [visual-engineering]
├── Task 9: postMessage handler in iframe (origin validation, requestId) [unspecified-high]
└── Task 10: Wallet state management in iframe [quick]

Wave 3 (Parent App Integration):
├── Task 11: Parent postMessage client [quick]
├── Task 12: Better Auth integration (link wallet to user) [unspecified-high]
├── Task 13: Embedded wallet connector component [visual-engineering]
├── Task 14: Wallet status / balance display [visual-engineering]
└── Task 15: Integrate into existing wallet connection UI [quick]

Wave 4 (End-to-End + Test Setup):
├── Task 16: End-to-end signing flow (create → sign → submit) [deep]
├── Task 17: Setup Playwright + vitest infrastructure [quick]
├── Task 18: Write e2e tests for postMessage protocol [unspecified-high]
└── Task 19: Write e2e tests for signing flow [unspecified-high]

Wave 5 (Security Hardening + Polish):
├── Task 20: Security audit (buffer clearing, origin validation, key exposure) [unspecified-high]
├── Task 21: Error handling + edge cases [unspecified-high]
├── Task 22: Performance optimization (iframe load <500ms, sign <200ms) [quick]
└── Task 23: Code cleanup + lint + typecheck [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
├── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 2 → Task 6 → Task 9 → Task 11 → Task 16 → F1-F4 → user okay
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 5 (Waves 1 & 2)
```

### Dependency Matrix

| Task | Depends On           | Blocks         |
| ---- | -------------------- | -------------- |
| 1    | None                 | 2, 6, 12       |
| 2    | None                 | 6, 7           |
| 3    | None                 | 8, 9, 10       |
| 4    | None                 | 9, 11          |
| 5    | None                 | 3, 8           |
| 6    | 1, 2                 | 7, 9, 10       |
| 7    | 2, 6                 | 9, 10          |
| 8    | 3                    | 16             |
| 9    | 3, 4, 6              | 11, 16         |
| 10   | 6, 7                 | 11             |
| 11   | 4, 9                 | 13, 14, 15, 16 |
| 12   | 1                    | 13, 15         |
| 13   | 11, 12               | 15, 16         |
| 14   | 11                   | 16             |
| 15   | 11, 12, 13           | 16             |
| 16   | 8, 9, 11, 13, 14, 15 | 18, 19, 20     |
| 17   | None                 | 18, 19         |
| 18   | 4, 9, 17             | 20             |
| 19   | 16, 17               | 20             |
| 20   | 18, 19               | 21             |
| 21   | 20                   | 22             |
| 22   | 21                   | 23             |
| 23   | 22                   | F1-F4          |

### Agent Dispatch Summary

- **Wave 1**: 5 tasks → `quick` (T1-T5)
- **Wave 2**: 5 tasks → `deep` (T6), `unspecified-high` (T7, T9), `visual-engineering` (T8), `quick` (T10)
- **Wave 3**: 5 tasks → `quick` (T11, T15), `unspecified-high` (T12), `visual-engineering` (T13, T14)
- **Wave 4**: 4 tasks → `deep` (T16), `quick` (T17), `unspecified-high` (T18, T19)
- **Wave 5**: 4 tasks → `unspecified-high` (T20, T21), `quick` (T22, T23)
- **Wave FINAL**: 4 tasks → `oracle` (F1), `unspecified-high` (F2, F3), `deep` (F4)

---

## TODOs

- [x] 1. **Enable PRF in Better Auth Passkey Config**

  **What to do**:
  - Update `src/server/auth/auth.ts` to enable PRF extension in passkey plugin
  - Change `extensions: { credProps: true }` to `extensions: { credProps: true, prf: true }` for both registration and authentication
  - Verify Better Auth passkey plugin supports PRF by checking types/compilation
  - Document that users must re-register their passkey for PRF to work (existing passkeys without PRF extension cannot retroactively gain PRF capability)

  **Must NOT do**:
  - Do NOT change any other Better Auth configuration (OAuth, social auth, etc.)
  - Do NOT add new DB tables or schema changes
  - Do NOT modify the existing passkey client configuration beyond what's needed for PRF

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple configuration change with verification
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `solana-dev`: Not needed for Better Auth config change

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 2, 6, 12
  - **Blocked By**: None

  **References**:
  - `src/server/auth/auth.ts:passkey({...})` — Current passkey config (add `prf: true`)
  - Better Auth docs: `https://www.better-auth.com/docs/plugins/passkey` — Passkey plugin configuration
  - WebAuthn PRF spec: `https://github.com/w3c/webauthn/blob/main/explainers/prf-extension.md` — PRF extension requirements

  **Acceptance Criteria**:
  - [ ] `src/server/auth/auth.ts` has `prf: true` in both registration and authentication extensions
  - [ ] `bun run build` compiles without type errors
  - [ ] Better Auth types accept the `prf` extension property

  **QA Scenarios**:

  ```
  Scenario: PRF extension enabled in config
    Tool: Bash (file read + grep)
    Preconditions: None
    Steps:
      1. Read `src/server/auth/auth.ts`
      2. Assert file contains `prf: true` in passkey registration extensions
      3. Assert file contains `prf: true` in passkey authentication extensions
    Expected Result: Both assertions pass
    Evidence: .sisyphus/evidence/task-1-prf-enabled.txt
  ```

  **Evidence to Capture**:
  - [ ] Screenshot or text capture of config file showing `prf: true`

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(wallet): enable PRF extension in Better Auth passkey config`
  - Files: `src/server/auth/auth.ts`
  - Pre-commit: `bun run build`

- [x] 2. **Fix prf-solana.ts — Connect Salt, Replace Placeholders, Add Security**

  **What to do**:
  - Connect `makePrfSalt(userId)` to the HKDF flow: use the salt in `deriveSolanaSeedFromPrf()` instead of hardcoded salt
  - Replace `"your-app"` placeholder strings with app-specific identifier (use `"vela"` or derive from env)
  - Add buffer zeroing after keypair derivation to clear PRF output and seed from memory
  - Add input validation (check prfOutput is valid ArrayBuffer/Uint8Array, check length >= 32 bytes)
  - Add error handling with typed errors for crypto failures
  - Export a unified function: `deriveWalletFromPrf(prfOutput: ArrayBuffer, userId: string)` that uses the userId-derived salt

  **Must NOT do**:
  - Do NOT add WebAuthn API calls to this file (that goes in the iframe)
  - Do NOT add UI code
  - Do NOT change the exported function signatures in a breaking way (keep `keypairFromPrf` for backward compatibility if needed)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Crypto utility fixes, focused file changes
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `solana-dev`: Not needed for utility fixes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Tasks 6, 7
  - **Blocked By**: None

  **References**:
  - `src/frontend/crypto/prf-solana.ts` — Current implementation (HKDF correct but disconnected)
  - `@noble/hashes/hkdf.js` docs — HKDF API reference
  - `@solana/web3.js` docs — `Keypair.fromSeed()` API

  **Acceptance Criteria**:
  - [ ] `deriveSolanaSeedFromPrf()` uses salt derived from `userId` via `makePrfSalt()`
  - [ ] No `"your-app"` strings remain in the file
  - [ ] `keypairFromPrf()` zeros out PRF output buffer after deriving keypair
  - [ ] `keypairFromPrf()` zeros out seed buffer after creating Keypair
  - [ ] Input validation throws descriptive error for invalid `prfOutput`
  - [ ] New unified export: `deriveWalletFromPrf(prfOutput, userId)`

  **QA Scenarios**:

  ```
  Scenario: Deterministic wallet derivation
    Tool: Bash (node REPL)
    Preconditions: None
    Steps:
      1. Import { deriveWalletFromPrf } from './src/frontend/crypto/prf-solana'
      2. Create mock PRF output: new Uint8Array(32).fill(0xab)
      3. Call deriveWalletFromPrf(mockPrf, "user-123") → record public key A
      4. Call deriveWalletFromPrf(mockPrf, "user-123") → record public key B
      5. Assert public key A equals public key B
    Expected Result: Both derivations produce identical public key (deterministic)
    Evidence: .sisyphus/evidence/task-2-deterministic-derivation.txt

  Scenario: Buffer clearing after derivation
    Tool: Bash (node REPL)
    Preconditions: None
    Steps:
      1. Create mock PRF buffer: const prf = new Uint8Array(32).fill(0xab)
      2. Call keypairFromPrf(prf)
      3. Assert prf buffer is filled with zeros after call
    Expected Result: Buffer is zeroed (memory security)
    Evidence: .sisyphus/evidence/task-2-buffer-clearing.txt
  ```

  **Evidence to Capture**:
  - [ ] Node REPL output showing deterministic derivation
  - [ ] Node REPL output showing buffer zeroing

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(crypto): connect PRF salt flow, replace placeholders, add buffer clearing`
  - Files: `src/frontend/crypto/prf-solana.ts`
  - Pre-commit: `bun run build`

- [x] 3. **Create Iframe Wallet Route + Sandbox Configuration**

  **What to do**:
  - Create `/src/app/wallet/page.tsx` — Client-only iframe content route (must be `"use client"`)
  - The route renders the wallet iframe component that handles PRF + signing
  - Configure Next.js to serve this route without SSR: use `dynamic(() => import(...), { ssr: false })` or ensure component is client-only
  - Add CSP headers for the wallet route (strict: `script-src 'self'; object-src 'none';`)
  - Add `sandbox` attributes to the iframe element: `allow-scripts` but NOT `allow-same-origin` if using `srcdoc`, or standard iframe with `src` to same-origin route
  - Create `/src/frontend/wallet/iframe/` directory for iframe-specific components

  **Must NOT do**:
  - Do NOT add RPC client or balance queries inside the iframe
  - Do NOT make the iframe route server-rendered
  - Do NOT expose crypto code in SSR context

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Route creation and Next.js config
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Tasks 8, 9, 10
  - **Blocked By**: None

  **References**:
  - `src/app/layout.tsx` — Root layout pattern
  - `src/app/page.tsx` — Existing page structure
  - Next.js docs: Dynamic imports with `ssr: false` for client-only components

  **Acceptance Criteria**:
  - [ ] `/src/app/wallet/page.tsx` exists and is client-only (no SSR crypto code)
  - [ ] Iframe component has appropriate sandbox attributes
  - [ ] Route loads without SSR errors (`npm run build` passes)
  - [ ] Route is accessible at `http://localhost:3000/wallet`

  **QA Scenarios**:

  ```
  Scenario: Iframe route loads without SSR errors
    Tool: Playwright
    Preconditions: Dev server running at localhost:3000
    Steps:
      1. Navigate to http://localhost:3000/wallet
      2. Wait for page load (timeout: 10s)
      3. Assert no console errors related to "window is not defined" or "navigator is not defined"
      4. Assert page contains iframe element with id="wallet-iframe"
    Expected Result: Page loads, iframe present, no SSR/crypto errors
    Evidence: .sisyphus/evidence/task-3-iframe-load.png
  ```

  **Evidence to Capture**:
  - [ ] Playwright screenshot of /wallet route showing iframe

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(wallet): create isolated wallet iframe route with sandbox`
  - Files: `src/app/wallet/page.tsx`, `src/frontend/wallet/iframe/`
  - Pre-commit: `bun run build`

- [x] 4. **Define postMessage Protocol (Types + Validation)**

  **What to do**:
  - Create `/src/frontend/wallet/protocol.ts` with:
    - Message types enum: `WALLET_SIGN`, `WALLET_SIGN_RESPONSE`, `WALLET_SIGN_ERROR`, `WALLET_READY`, `WALLET_ADDRESS`
    - TypeScript interfaces for each message type with `requestId: string` (UUID)
    - Protocol version constant: `vela-wallet:v1`
    - Zod schemas for validating incoming messages (reject malformed messages)
    - Helper functions: `createSignRequest(tx: string, requestId: string)`, `parseSignResponse(data: unknown)`
  - Define the message structure:
    - Request: `{ protocol: "vela-wallet:v1", type: "WALLET_SIGN", requestId: "...", tx: "base64-serialized-tx" }`
    - Response: `{ protocol: "vela-wallet:v1", type: "WALLET_SIGN_RESPONSE", requestId: "...", signature: "base64-signature" }`
    - Error: `{ protocol: "vela-wallet:v1", type: "WALLET_SIGN_ERROR", requestId: "...", error: "..." }`

  **Must NOT do**:
  - Do NOT add encryption or compression to messages
  - Do NOT support cross-origin messages (same-origin only)
  - Do NOT add versioning beyond `vela-wallet:v1`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Type definitions and validation schemas
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Tasks 9, 11
  - **Blocked By**: None

  **References**:
  - `src/frontend/lib/utils.ts` — Existing utility patterns
  - Zod docs: `https://zod.dev/?id=basic-usage` — Schema validation syntax

  **Acceptance Criteria**:
  - [ ] `protocol.ts` exports all message types, interfaces, and Zod schemas
  - [ ] Zod schema rejects messages without `protocol`, `type`, `requestId`
  - [ ] Zod schema rejects messages with unknown `type`
  - [ ] `createSignRequest` returns correctly shaped message object
  - [ ] `parseSignResponse` validates and returns typed response or throws

  **QA Scenarios**:

  ```
  Scenario: Valid sign request passes validation
    Tool: Bash (node REPL)
    Preconditions: None
    Steps:
      1. Import { createSignRequest, SignRequestSchema } from './src/frontend/wallet/protocol'
      2. const msg = createSignRequest("mock-tx", "req-123")
      3. Assert SignRequestSchema.safeParse(msg).success === true
    Expected Result: Schema validation passes
    Evidence: .sisyphus/evidence/task-4-protocol-validation.txt

  Scenario: Invalid message rejected by schema
    Tool: Bash (node REPL)
    Preconditions: None
    Steps:
      1. Import { SignRequestSchema } from './src/frontend/wallet/protocol'
      2. const invalid = { type: "UNKNOWN", tx: "mock" } // missing protocol, requestId
      3. Assert SignRequestSchema.safeParse(invalid).success === false
    Expected Result: Schema validation fails for malformed message
    Evidence: .sisyphus/evidence/task-4-protocol-rejection.txt
  ```

  **Evidence to Capture**:
  - [ ] Node REPL output showing validation pass/fail

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(wallet): define postMessage protocol with types and zod validation`
  - Files: `src/frontend/wallet/protocol.ts`
  - Pre-commit: `bun run build`

- [x] 5. **Add CSP Headers + Security Config for Wallet Route**

  **What to do**:
  - Add CSP headers in `next.config.ts` or middleware for `/wallet` route:
    - `default-src 'self'`
    - `script-src 'self'` (no inline scripts)
    - `object-src 'none'`
    - `base-uri 'none'`
    - `frame-ancestors 'self'` (only parent app can embed)
  - Ensure `next.config.ts` has appropriate headers config
  - Add `X-Frame-Options: SAMEORIGIN` for wallet route
  - Consider adding `Referrer-Policy: strict-origin-when-cross-origin`

  **Must NOT do**:
  - Do NOT add CSP to ALL routes (only wallet route needs strict CSP)
  - Do NOT disable any existing security headers
  - Do NOT add `unsafe-inline` or `unsafe-eval` to script-src

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Configuration change
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Tasks 3, 8 (CSP must be ready before iframe loads)
  - **Blocked By**: None

  **References**:
  - `next.config.ts` or `next.config.js` — Next.js config file
  - MDN CSP docs: `https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP` — CSP directive reference

  **Acceptance Criteria**:
  - [ ] `/wallet` route serves with CSP headers (verify with curl)
  - [ ] CSP does NOT include `unsafe-inline` or `unsafe-eval`
  - [ ] `X-Frame-Options: SAMEORIGIN` present
  - [ ] `next.config.ts` compiles (`bun run build` passes)

  **QA Scenarios**:

  ```
  Scenario: Wallet route has strict CSP headers
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl -I http://localhost:3000/wallet
      2. Assert response headers contain "Content-Security-Policy"
      3. Assert CSP does NOT contain "unsafe-inline" or "unsafe-eval"
      4. Assert response headers contain "X-Frame-Options: SAMEORIGIN"
    Expected Result: All security headers present and strict
    Evidence: .sisyphus/evidence/task-5-csp-headers.txt
  ```

  **Evidence to Capture**:
  - [ ] curl output showing headers

  **Commit**: YES (groups with Wave 1)
  - Message: `security(wallet): add CSP and frame protection for wallet route`
  - Files: `next.config.ts` (or middleware file)
  - Pre-commit: `bun run build`

- [x] 6. **Implement WebAuthn PRF Integration in Iframe**

  **What to do**:
  - Create `/src/frontend/wallet/iframe/webauthn-prf.ts` with:
    - `registerCredential(userId: string)` — Calls `navigator.credentials.create()` with PRF extension using `userId` as eval input
    - `authenticateAndGetPrf(userId: string, credentialId?: string)` — Calls `navigator.credentials.get()` with PRF eval to retrieve deterministic output
    - Extract PRF result from `credential.getClientExtensionResults().prf.eval.first`
    - Return PRF output as `ArrayBuffer`
  - Handle browser compatibility: check if PRF is supported before attempting, show error if not supported
  - Use `makePrfSalt(userId)` or userId directly as the PRF eval input for determinism

  **Must NOT do**:
  - Do NOT store credential info in localStorage (pass to parent via postMessage if needed)
  - Do NOT fall back to non-PRF passkey creation (PRF is required for this wallet)
  - Do NOT handle recovery (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: WebAuthn PRF API is complex, requires careful handling of browser APIs, error cases, and security
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `solana-dev`: Not needed for WebAuthn integration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 10)
  - **Blocks**: Tasks 7, 9, 10
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `src/frontend/crypto/prf-solana.ts` — `makePrfSalt()` for PRF eval input
  - WebAuthn PRF explainer: `https://github.com/w3c/webauthn/blob/main/explainers/prf-extension.md` — PRF extension API
  - MDN: `https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API` — WebAuthn API reference

  **Acceptance Criteria**:
  - [ ] `registerCredential()` creates passkey with PRF extension enabled
  - [ ] `authenticateAndGetPrf()` returns consistent PRF output for same userId + same passkey
  - [ ] Browser without PRF support shows clear error message
  - [ ] Functions handle WebAuthn errors (cancelled, not supported, etc.) gracefully

  **QA Scenarios**:

  ```
  Scenario: PRF output is deterministic for same user
    Tool: Playwright (manual browser automation)
    Preconditions: Browser supports PRF (Chrome 132+), user registered passkey
    Steps:
      1. Open /wallet in browser
      2. Call authenticateAndGetPrf("user-123") → PRF output A
      3. Call authenticateAndGetPrf("user-123") again → PRF output B
      4. Assert PRF output A matches PRF output B byte-for-byte
    Expected Result: Same userId + same passkey = identical PRF output
    Evidence: .sisyphus/evidence/task-6-deterministic-prf.txt

  Scenario: Browser without PRF shows error
    Tool: Playwright (with unsupported browser config or mocked)
    Preconditions: Browser that does not support PRF
    Steps:
      1. Open /wallet
      2. Attempt to authenticate with PRF
      3. Assert error message "PRF not supported" is shown
    Expected Result: Clear error, no silent failure
    Evidence: .sisyphus/evidence/task-6-prf-unsupported.png
  ```

  **Evidence to Capture**:
  - [ ] Console output or screenshot showing PRF authentication
  - [ ] Error screenshot for unsupported browser

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(wallet): implement WebAuthn PRF integration in iframe`
  - Files: `src/frontend/wallet/iframe/webauthn-prf.ts`
  - Pre-commit: `bun run build`

- [x] 7. **Key Derivation + Buffer Clearing in Iframe**

  **What to do**:
  - Create `/src/frontend/wallet/iframe/key-derivation.ts`:
    - `deriveWallet(userId: string, prfOutput: ArrayBuffer)` — Uses fixed `prf-solana.ts` to derive keypair
    - Stores derived keypair in iframe memory only (module-level variable, NOT window/global)
    - Provides `getWalletAddress()` — Returns derived public key as base58 string
    - Provides `signTransaction(serializedTx: string)` — Signs transaction and returns signature
    - After deriving keypair, zeros out PRF output buffer and seed buffer
    - Never exposes private key outside this module
  - Ensure keypair is re-derived on every iframe load (no caching across reloads)

  **Must NOT do**:
  - Do NOT store keypair in localStorage, sessionStorage, or any persistent storage
  - Do NOT expose private key via any exported function
  - Do NOT cache keypair across iframe reloads

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Crypto-critical code, security sensitive, needs thorough review
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 8, 9, 10)
  - **Blocks**: Tasks 9, 10
  - **Blocked By**: Tasks 2, 6

  **References**:
  - `src/frontend/crypto/prf-solana.ts` — Fixed derivation utility
  - `@solana/web3.js` docs — `Keypair.fromSeed()`, `Transaction` signing

  **Acceptance Criteria**:
  - [ ] `deriveWallet()` produces deterministic address for same inputs
  - [ ] `getWalletAddress()` returns valid base58 Solana public key
  - [ ] `signTransaction()` returns valid Ed25519 signature
  - [ ] PRF buffer is zeroed after derivation
  - [ ] Seed buffer is zeroed after Keypair creation
  - [ ] Private key is NOT accessible from outside the module

  **QA Scenarios**:

  ```
  Scenario: Wallet derivation is deterministic
    Tool: Bash (node REPL)
    Preconditions: None
    Steps:
      1. Import { deriveWallet } from './src/frontend/wallet/iframe/key-derivation'
      2. const kp1 = deriveWallet("user-123", mockPrf)
      3. const kp2 = deriveWallet("user-123", mockPrf)
      4. Assert kp1.getWalletAddress() === kp2.getWalletAddress()
    Expected Result: Same inputs produce same wallet address
    Evidence: .sisyphus/evidence/task-7-deterministic-wallet.txt

  Scenario: Transaction signing produces valid signature
    Tool: Bash (node REPL)
    Preconditions: None
    Steps:
      1. Import { deriveWallet } from './src/frontend/wallet/iframe/key-derivation'
      2. const wallet = deriveWallet("user-123", mockPrf)
      3. const signature = wallet.signTransaction(mockSerializedTx)
      4. Assert signature is 64 bytes (Ed25519 signature length)
      5. Assert signature is not all zeros
    Expected Result: Valid signature produced
    Evidence: .sisyphus/evidence/task-7-valid-signature.txt
  ```

  **Evidence to Capture**:
  - [ ] Node REPL output showing deterministic address
  - [ ] Node REPL output showing valid signature

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(wallet): implement key derivation and signing in iframe`
  - Files: `src/frontend/wallet/iframe/key-derivation.ts`
  - Pre-commit: `bun run build`

- [x] 8. **Transaction Approval UI in Iframe**

  **What to do**:
  - Create `/src/frontend/wallet/iframe/components/ApprovalUI.tsx`:
    - Shows transaction details: recipient address, amount (SOL), fee estimate
    - "Confirm" and "Reject" buttons
    - Uses shadcn/ui components (Card, Button, Alert) for consistency
    - Handles loading state while signing
    - Shows error state if signing fails
    - Must be simple and clear — this is the security-critical UI
  - The UI is triggered by incoming `WALLET_SIGN` postMessage
  - After user confirms, calls signing function and sends response back
  - After user rejects, sends `WALLET_SIGN_ERROR` with "User rejected"

  **Must NOT do**:
  - Do NOT show raw transaction bytes (show human-readable details only)
  - Do NOT auto-confirm or have a default "yes" action
  - Do NOT include complex styling (keep it minimal, focused on security)
  - Do NOT add balance queries (iframe doesn't have RPC access)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component using shadcn/ui, needs to be clear and security-focused
  - **Skills**: [`shadcn-ui`]
    - `shadcn-ui`: Use existing shadcn components (Card, Button, Alert) for consistent look

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 9, 10)
  - **Blocks**: Task 16
  - **Blocked By**: Task 3

  **References**:
  - `src/frontend/lib/utils.ts` — `cn()` utility for Tailwind
  - shadcn/ui docs — Card, Button, Alert components
  - Existing UI in `src/app/page.tsx` — Wallet connection demo for style reference

  **Acceptance Criteria**:
  - [ ] Approval UI shows recipient, amount, and fee
  - [ ] UI has clearly labeled "Confirm" and "Reject" buttons
  - [ ] Confirm triggers signing and sends response
  - [ ] Reject sends error response
  - [ ] UI is styled with shadcn/ui components
  - [ ] Component is responsive and accessible

  **QA Scenarios**:

  ```
  Scenario: Approval UI renders with transaction details
    Tool: Playwright
    Preconditions: Dev server running, iframe loaded
    Steps:
      1. Navigate to /wallet
      2. Trigger WALLET_SIGN postMessage with mock transaction
      3. Assert iframe shows "Send 0.1 SOL to [address]"
      4. Assert "Confirm" button is visible
      5. Assert "Reject" button is visible
      6. Screenshot approval UI
    Expected Result: UI shows clear transaction details and action buttons
    Evidence: .sisyphus/evidence/task-8-approval-ui.png

  Scenario: Reject button sends error response
    Tool: Playwright
    Preconditions: Dev server running, parent app listening for postMessage
    Steps:
      1. Parent sends WALLET_SIGN to iframe
      2. Click "Reject" button in iframe
      3. Parent receives WALLET_SIGN_ERROR with "User rejected"
      4. Assert error message matches expected
    Expected Result: Rejection is communicated back to parent
    Evidence: .sisyphus/evidence/task-8-reject-flow.txt
  ```

  **Evidence to Capture**:
  - [ ] Playwright screenshot of approval UI
  - [ ] Playwright log of reject flow

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(wallet): add transaction approval UI in iframe`
  - Files: `src/frontend/wallet/iframe/components/ApprovalUI.tsx`
  - Pre-commit: `bun run build`

- [x] 9. **postMessage Handler in Iframe (Origin Validation + requestId)**

  **What to do**:
  - Create `/src/frontend/wallet/iframe/messaging.ts`:
    - `setupMessageHandlers()` — Sets up `window.addEventListener('message', ...)`
    - Validates `event.origin === window.location.origin` on EVERY message
    - Validates message structure using Zod schema from `protocol.ts`
    - Routes messages by type: `WALLET_SIGN` → approval UI → sign → response
    - Correlates responses with requests using `requestId` (must match)
    - Ignores messages with unknown protocol version
    - Handles timeout: if no response within 30s, send `WALLET_SIGN_ERROR` with timeout
  - Ensure iframe does NOT process messages from parent until `WALLET_READY` handshake

  **Must NOT do**:
  - Do NOT accept messages from `event.origin === "null"` or any unexpected origin
  - Do NOT process messages without validating `requestId`
  - Do NOT expose internal state via postMessage responses

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Security-critical code, origin validation, protocol enforcement
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 10)
  - **Blocks**: Tasks 11, 16
  - **Blocked By**: Tasks 3, 4, 6

  **References**:
  - `src/frontend/wallet/protocol.ts` — Message types and Zod schemas
  - MDN: `https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage` — postMessage security best practices

  **Acceptance Criteria**:
  - [ ] All incoming messages validate origin
  - [ ] All incoming messages validate Zod schema
  - [ ] `requestId` correlation enforced (response must match request)
  - [ ] Unknown protocol versions are rejected
  - [ ] `WALLET_SIGN` triggers approval UI flow
  - [ ] Timeout handling sends error after 30s

  **QA Scenarios**:

  ```
  Scenario: Invalid origin message is ignored
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Open /wallet in iframe
      2. Send postMessage from a different origin (simulate via JS)
      3. Assert iframe does NOT respond
      4. Assert no console errors (silent ignore)
    Expected Result: Invalid origin messages are silently ignored
    Evidence: .sisyphus/evidence/task-9-invalid-origin.txt

  Scenario: Valid sign request flows through approval UI
    Tool: Playwright
    Preconditions: Dev server running, wallet derived
    Steps:
      1. Parent sends valid WALLET_SIGN with requestId "abc-123"
      2. Assert iframe shows approval UI
      3. Click "Confirm"
      4. Assert parent receives WALLET_SIGN_RESPONSE with requestId "abc-123"
      5. Assert signature is present and valid
    Expected Result: Full round-trip with requestId correlation
    Evidence: .sisyphus/evidence/task-9-valid-sign-flow.txt
  ```

  **Evidence to Capture**:
  - [ ] Playwright console logs showing ignored invalid messages
  - [ ] Playwright logs showing successful sign flow

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(wallet): implement postMessage handler with origin validation and requestId`
  - Files: `src/frontend/wallet/iframe/messaging.ts`
  - Pre-commit: `bun run build`

- [x] 10. **Wallet State Management in Iframe**

  **What to do**:
  - Create `/src/frontend/wallet/iframe/state.ts`:
    - Simple state machine: `IDLE` → `AUTHENTICATING` → `DERIVING` → `READY` → `SIGNING` → `IDLE`
    - Store: current wallet address (or null), isReady boolean, error state
    - `initializeWallet(userId: string)` — Orchestrates: auth → derive → ready
    - `getState()` — Returns current state for UI consumption
    - `isReady()` — Returns true when wallet is derived and ready to sign
    - NO persistence — state is in-memory only, lost on iframe reload
  - Export state hooks for React components in iframe

  **Must NOT do**:
  - Do NOT persist state to localStorage or any storage
  - Do NOT expose private key in state
  - Do NOT add complex state management (keep it simple)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple state management, not complex business logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9)
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 6, 7

  **References**:
  - React docs: `useState`, `useCallback` patterns
  - `src/frontend/wallet/iframe/key-derivation.ts` — Wallet derivation module

  **Acceptance Criteria**:
  - [ ] State transitions correctly through the flow
  - [ ] `isReady()` returns true after successful derivation
  - [ ] State is NOT persisted across reloads
  - [ ] Error state is set on derivation failure

  **QA Scenarios**:

  ```
  Scenario: Wallet state transitions correctly
    Tool: Bash (node REPL) or Playwright
    Preconditions: None
    Steps:
      1. Import { initializeWallet, getState } from './src/frontend/wallet/iframe/state'
      2. Assert getState().status === "IDLE"
      3. initializeWallet("user-123") → status becomes "AUTHENTICATING"
      4. After auth + derivation → status becomes "READY"
      5. Assert getState().address is a valid base58 string
    Expected Result: State transitions through expected phases
    Evidence: .sisyphus/evidence/task-10-state-transitions.txt
  ```

  **Evidence to Capture**:
  - [ ] State transition log

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(wallet): add iframe wallet state management`
  - Files: `src/frontend/wallet/iframe/state.ts`
  - Pre-commit: `bun run build`

- [x] 11. **Parent postMessage Client**

  **What to do**:
  - Create `/src/frontend/wallet/client.ts`:
    - `EmbeddedWalletClient` class for parent app to communicate with iframe
    - `connect(iframe: HTMLIFrameElement)` — Establishes connection, sends handshake
    - `signTransaction(serializedTx: string): Promise<string>` — Sends WALLET_SIGN, awaits response, returns signature
    - `getAddress(): Promise<string>` — Requests wallet address from iframe
    - `disconnect()` — Cleans up event listeners
    - Handles timeout, errors, and iframe load failures
    - Internal: generates `requestId` for each request, matches responses
  - Export as singleton or factory for easy integration

  **Must NOT do**:
  - Do NOT expose iframe internals to parent app consumers
  - Do NOT cache signatures or private data
  - Do NOT bypass the protocol (always use postMessage)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Client wrapper, straightforward async messaging
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 14, 15)
  - **Blocks**: Tasks 13, 14, 15, 16
  - **Blocked By**: Tasks 4, 9

  **References**:
  - `src/frontend/wallet/protocol.ts` — Message types
  - `src/frontend/wallet/iframe/messaging.ts` — Iframe handler (for protocol understanding)

  **Acceptance Criteria**:
  - [ ] `connect()` establishes handshake and returns ready state
  - [ ] `signTransaction()` sends request and returns signature on success
  - [ ] `signTransaction()` rejects with error on timeout (30s)
  - [ ] `getAddress()` returns wallet address from iframe
  - [ ] `disconnect()` cleans up all listeners

  **QA Scenarios**:

  ```
  Scenario: Client signs transaction through iframe
    Tool: Playwright
    Preconditions: Dev server running, parent app loaded, iframe ready
    Steps:
      1. Parent app instantiates EmbeddedWalletClient
      2. client.connect(iframeElement) → assert ready
      3. const signature = await client.signTransaction(mockSerializedTx)
      4. Assert signature is a valid base64 string
      5. Assert signature length is 88 chars (64 bytes base64)
    Expected Result: Transaction signed via iframe, signature returned
    Evidence: .sisyphus/evidence/task-11-client-sign.txt

  Scenario: Client handles iframe timeout
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Parent app connects to iframe
      2. Send sign request but do NOT click confirm in iframe
      3. Wait 30 seconds
      4. Assert client.signTransaction() rejects with "Timeout" error
    Expected Result: Graceful timeout handling
    Evidence: .sisyphus/evidence/task-11-client-timeout.txt
  ```

  **Evidence to Capture**:
  - [ ] Playwright logs showing successful sign
  - [ ] Playwright logs showing timeout error

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(wallet): implement parent postMessage client for iframe wallet`
  - Files: `src/frontend/wallet/client.ts`
  - Pre-commit: `bun run build`

- [x] 12. **Better Auth Integration (Link Wallet to User)**

  **What to do**:
  - Modify `src/app/page.tsx` or create wallet connector logic:
    - After Better Auth login, get `user.id` from auth state
    - Pass `user.id` to iframe via query param or postMessage handshake (iframe needs userId to derive wallet)
    - Ensure wallet is derived deterministically from Better Auth userId (same user = same wallet)
    - Add "Connect Embedded Wallet" button that triggers iframe load + auth flow
  - The embedded wallet should be a new connector option alongside existing Phantom/Solflare
  - Store wallet connection state in parent app (NOT private key, just "connected: true/false" and address)

  **Must NOT do**:
  - Do NOT replace existing wallet connectors (coexist)
  - Do NOT modify Better Auth schema or DB tables
  - Do NOT store private key or PRF output in parent app

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration point between auth system and wallet, needs careful handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 13, 14, 15)
  - **Blocks**: Tasks 13, 15
  - **Blocked By**: Task 1

  **References**:
  - `src/frontend/auth/auth.ts` — Better Auth client
  - `src/app/page.tsx` — Existing wallet connection UI
  - `src/frontend/providers/providers.tsx` — Provider patterns

  **Acceptance Criteria**:
  - [ ] After Better Auth login, embedded wallet can be connected
  - [ ] Same Better Auth user always gets same wallet address
  - [ ] Embedded wallet coexists with Phantom/Solflare connectors
  - [ ] Wallet address is displayed in parent app UI

  **QA Scenarios**:

  ```
  Scenario: Wallet derived from Better Auth userId
    Tool: Playwright
    Preconditions: Dev server running, user logged in with passkey
    Steps:
      1. Log in via Better Auth (passkey with PRF)
      2. Click "Connect Embedded Wallet" button
      3. Iframe loads and derives wallet from user.id
      4. Assert wallet address is displayed in parent app
      5. Log out, log back in with same user
      6. Click "Connect Embedded Wallet" again
      7. Assert same wallet address is shown
    Expected Result: Deterministic wallet per user
    Evidence: .sisyphus/evidence/task-12-auth-integration.txt
  ```

  **Evidence to Capture**:
  - [ ] Playwright logs or screenshots showing wallet address after auth

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(wallet): integrate embedded wallet with Better Auth user flow`
  - Files: `src/app/page.tsx`, `src/frontend/components/wallet/`
  - Pre-commit: `bun run build`

- [x] 13. **Embedded Wallet Connector Component**

  **What to do**:
  - Create `/src/frontend/components/wallet/EmbeddedWalletButton.tsx`:
    - Button that triggers embedded wallet connection flow
    - States: "Connect Embedded Wallet" → "Connecting..." → "Wallet Connected" (shows truncated address)
    - On click: load iframe, trigger WebAuthn auth, derive wallet, show address
    - Uses shadcn/ui Button component
    - Responsive, accessible (keyboard navigation, ARIA labels)
  - Create `/src/frontend/components/wallet/WalletCard.tsx`:
    - Card showing wallet status: connected/disconnected, address, balance placeholder
    - "Disconnect" button that unloads iframe and clears state

  **Must NOT do**:
  - Do NOT replace existing wallet UI (add alongside)
  - Do NOT show private key or recovery phrase
  - Do NOT add SPL token or complex wallet features

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI components using shadcn/ui, consistent with existing design
  - **Skills**: [`shadcn-ui`]
    - `shadcn-ui`: Use Button, Card, Badge components

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 12, 14, 15)
  - **Blocks**: Tasks 15, 16
  - **Blocked By**: Tasks 11, 12

  **References**:
  - `src/app/page.tsx` — Existing wallet UI for style reference
  - shadcn/ui docs — Button, Card, Badge
  - `src/frontend/lib/utils.ts` — `cn()` utility

  **Acceptance Criteria**:
  - [ ] Button shows correct state transitions
  - [ ] Connected state displays truncated wallet address
  - [ ] Disconnect button clears wallet state
  - [ ] Components use shadcn/ui styling
  - [ ] Keyboard accessible and ARIA compliant

  **QA Scenarios**:

  ```
  Scenario: Wallet button state transitions
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Assert "Connect Embedded Wallet" button is visible
      2. Click button → assert "Connecting..." state
      3. After iframe auth + derivation → assert "Connected" with address
      4. Assert address is truncated (e.g., "abc...xyz")
      5. Click "Disconnect" → assert "Connect Embedded Wallet" shown again
    Expected Result: Correct state transitions and UI updates
    Evidence: .sisyphus/evidence/task-13-button-states.png
  ```

  **Evidence to Capture**:
  - [ ] Playwright screenshots of each button state

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(wallet): add embedded wallet connector UI components`
  - Files: `src/frontend/components/wallet/EmbeddedWalletButton.tsx`, `src/frontend/components/wallet/WalletCard.tsx`
  - Pre-commit: `bun run build`

- [x] 14. **Wallet Status / Balance Display**

  **What to do**:
  - Create `/src/frontend/components/wallet/WalletStatus.tsx`:
    - Displays wallet address (full + truncated), connection status
    - Shows SOL balance using `@solana/react-hooks` (parent app queries balance, NOT iframe)
    - Copy address to clipboard button
    - Link to Solana explorer (devnet)
    - Uses shadcn/ui components (Badge, Tooltip, Button)
  - Balance is fetched by parent app via existing `@solana/client` setup

  **Must NOT do**:
  - Do NOT add balance queries inside iframe
  - Do NOT add token balances (SOL only for MVP)
  - Do NOT add send/receive UI (that's handled by transaction flow)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Display component, uses existing Solana hooks
  - **Skills**: [`shadcn-ui`]
    - `shadcn-ui`: Use Badge, Tooltip for address display

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 12, 13, 15)
  - **Blocks**: Task 16
  - **Blocked By**: Task 11

  **References**:
  - `src/frontend/clients/solana-client.ts` — Solana client for balance queries
  - `@solana/react-hooks` docs — Balance hooks
  - shadcn/ui docs — Badge, Tooltip

  **Acceptance Criteria**:
  - [ ] Wallet address displayed with copy button
  - [ ] SOL balance shown (queried from devnet)
  - [ ] Explorer link opens correct address on devnet
  - [ ] Connection status badge shown (green/red)

  **QA Scenarios**:

  ```
  Scenario: Wallet status shows address and balance
    Tool: Playwright
    Preconditions: Dev server running, wallet connected
    Steps:
      1. Assert wallet address is displayed
      2. Assert "Copy" button is visible
      3. Click copy → assert clipboard contains full address
      4. Assert SOL balance is shown (may be 0 for new wallet)
      5. Assert "View on Explorer" link has correct devnet URL
    Expected Result: Complete wallet status display
    Evidence: .sisyphus/evidence/task-14-wallet-status.png
  ```

  **Evidence to Capture**:
  - [ ] Playwright screenshot of wallet status

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(wallet): add wallet status and balance display`
  - Files: `src/frontend/components/wallet/WalletStatus.tsx`
  - Pre-commit: `bun run build`

- [x] 15. **Integrate Embedded Wallet into Existing Wallet Connection UI**

  **What to do**:
  - Update `src/app/page.tsx` (or create new page) to show:
    - Existing Phantom/Solflare connectors (unchanged)
    - New "Embedded Wallet" connector option alongside them
    - When embedded wallet is selected, show wallet status, balance, and "Send SOL" button
    - The "Send SOL" button triggers transaction creation → iframe signing → submission
  - Ensure existing `@solana/react-hooks` integration continues to work
  - Add route or section for embedded wallet demo

  **Must NOT do**:
  - Do NOT remove or modify existing Phantom/Solflare connectors
  - Do NOT break existing wallet connection flow
  - Do NOT add complex DeFi features

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Integration task, wiring existing pieces together
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 12, 13, 14)
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 11, 12, 13

  **References**:
  - `src/app/page.tsx` — Existing wallet connection demo
  - `src/frontend/components/wallet/` — New wallet components
  - `src/frontend/providers/providers.tsx` — Provider setup

  **Acceptance Criteria**:
  - [ ] Existing wallet connectors still work
  - [ ] Embedded wallet connector is visible and functional
  - [ ] User can switch between external and embedded wallet
  - [ ] Page layout handles multiple wallet options gracefully

  **QA Scenarios**:

  ```
  Scenario: Both external and embedded wallets coexist
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Assert Phantom/Solflare connect buttons are present
      2. Assert "Connect Embedded Wallet" button is present
      3. Connect Phantom (mock or real) → assert Phantom address shown
      4. Connect Embedded Wallet → assert Embedded address shown
      5. Assert both addresses are different
      6. Assert no console errors
    Expected Result: Both wallet types work independently
    Evidence: .sisyphus/evidence/task-15-coexistence.png
  ```

  **Evidence to Capture**:
  - [ ] Playwright screenshot showing both wallet options

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(wallet): integrate embedded wallet alongside existing connectors`
  - Files: `src/app/page.tsx`, `src/frontend/components/wallet/`
  - Pre-commit: `bun run build`

- [x] 16. **End-to-End Signing Flow (Create → Sign → Submit)**

  **What to do**:
  - Create a complete demo flow in the parent app:
    1. User connects embedded wallet (Better Auth + iframe)
    2. User clicks "Send 0.001 SOL to [address]"
    3. Parent app creates a `Transaction` with `SystemProgram.transfer`
    4. Parent serializes transaction to base64
    5. Parent sends `WALLET_SIGN` to iframe via postMessage
    6. Iframe shows approval UI with transaction details
    7. User confirms → iframe signs transaction
    8. Iframe returns signature via postMessage
    9. Parent adds signature to transaction
    10. Parent submits transaction to Solana devnet via `@solana/client`
    11. Parent shows transaction success/failure with explorer link
  - Handle errors at each step: user rejection, timeout, network failure
  - Create `/src/frontend/components/wallet/SendSolForm.tsx` for the demo UI

  **Must NOT do**:
  - Do NOT support SPL tokens or complex program instructions
  - Do NOT add transaction simulation inside iframe (parent simulates before sending)
  - Do NOT skip the approval UI (security requirement)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex multi-step flow integrating multiple systems (auth, iframe, postMessage, Solana RPC, UI)
  - **Skills**: [`solana-dev`]
    - `solana-dev`: Solana transaction creation, serialization, submission via `@solana/client`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17, 18, 19)
  - **Blocks**: Tasks 18, 19, 20
  - **Blocked By**: Tasks 8, 9, 11, 13, 14, 15

  **References**:
  - `src/frontend/clients/solana-client.ts` — Solana client for devnet
  - `@solana/web3.js` docs — `SystemProgram.transfer`, `Transaction`, `sendAndConfirmTransaction`
  - `src/frontend/wallet/client.ts` — Parent postMessage client
  - `src/frontend/wallet/iframe/components/ApprovalUI.tsx` — Approval UI

  **Acceptance Criteria**:
  - [ ] Transaction is created correctly with SystemProgram.transfer
  - [ ] Transaction is serialized and sent to iframe
  - [ ] Approval UI shows correct recipient and amount
  - [ ] User confirmation triggers signing
  - [ ] Signature is valid and added to transaction
  - [ ] Transaction is submitted to devnet successfully
  - [ ] Transaction confirmation is shown with explorer link

  **QA Scenarios**:

  ```
  Scenario: Full SOL transfer flow from creation to confirmation
    Tool: Playwright
    Preconditions: Dev server running, wallet connected with devnet SOL
    Steps:
      1. Parent app shows "Send 0.001 SOL" button
      2. Click button → assert SendSolForm appears
      3. Enter recipient address: "GZb6xNKuGPo72DgzD3PkwmKCgCEWVvUZQ5KFS4LQJbch"
      4. Click "Send" → assert iframe shows approval UI
      5. Assert approval UI shows recipient and 0.001 SOL
      6. Click "Confirm" in iframe
      7. Assert parent receives signature
      8. Assert transaction is submitted (loading state)
      9. Assert success message with devnet explorer link appears
      10. Extract tx signature from success message
      11. Verify tx on devnet explorer (open link, assert confirmed)
    Expected Result: Complete end-to-end SOL transfer
    Evidence: .sisyphus/evidence/task-16-e2e-signing.png

  Scenario: User rejects transaction
    Tool: Playwright
    Preconditions: Dev server running, wallet connected
    Steps:
      1. Initiate SOL transfer
      2. Iframe shows approval UI
      3. Click "Reject"
      4. Assert parent app shows "Transaction rejected by user"
      5. Assert no transaction is submitted
    Expected Result: Graceful rejection handling
    Evidence: .sisyphus/evidence/task-16-reject-flow.txt
  ```

  **Evidence to Capture**:
  - [ ] Playwright screenshot of successful transaction
  - [ ] Playwright log of transaction signature
  - [ ] Devnet explorer screenshot showing confirmed tx

  **Commit**: YES (groups with Wave 4)
  - Message: `feat(wallet): implement end-to-end SOL transfer signing and submission`
  - Files: `src/frontend/components/wallet/SendSolForm.tsx`, `src/app/page.tsx` updates
  - Pre-commit: `bun run build`

- [x] 17. **Setup Playwright + Vitest Test Infrastructure**

  **What to do**:
  - Install test dependencies: `playwright`, `@playwright/test`, `vitest`, `@vitest/ui`
  - Add test scripts to `package.json`:
    - `"test:e2e": "playwright test"`
    - `"test:unit": "vitest"`
    - `"test:e2e:ui": "playwright test --ui"`
  - Create `playwright.config.ts`:
    - Test against `http://localhost:3000`
    - Single project: Chromium (MVP, expand later)
    - Screenshot on failure
    - Video recording on retry
  - Create `vitest.config.ts`:
    - Include `src/frontend/**/*.test.ts`
    - Exclude e2e tests
  - Create example test file to verify setup: `src/frontend/crypto/prf-solana.test.ts`
  - Add `.github/workflows/test.yml` or document test commands

  **Must NOT do**:
  - Do NOT add Jest (use Vitest for consistency with modern stacks)
  - Do NOT add complex test fixtures or databases
  - Do NOT add visual regression testing (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Infrastructure setup, configuration files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 16, 18, 19)
  - **Blocks**: Tasks 18, 19
  - **Blocked By**: None

  **References**:
  - `package.json` — Add test dependencies and scripts
  - Playwright docs: `https://playwright.dev/docs/intro` — Configuration reference
  - Vitest docs: `https://vitest.dev/config/` — Configuration reference

  **Acceptance Criteria**:
  - [ ] `playwright.config.ts` exists and is valid
  - [ ] `vitest.config.ts` exists and is valid
  - [ ] `bun run test:unit` executes without errors (even if zero tests)
  - [ ] `bun run test:e2e` launches Playwright (may fail if no tests written yet)
  - [ ] Example unit test for `prf-solana.ts` passes

  **QA Scenarios**:

  ```
  Scenario: Test infrastructure is functional
    Tool: Bash
    Preconditions: Dependencies installed
    Steps:
      1. bun run test:unit -- --run
      2. Assert exit code is 0 (no errors in infrastructure)
      3. bun run test:e2e -- --list
      4. Assert Playwright lists test files (even if empty)
    Expected Result: Test commands execute successfully
    Evidence: .sisyphus/evidence/task-17-test-infra.txt
  ```

  **Evidence to Capture**:
  - [ ] Terminal output showing test commands working

  **Commit**: YES (groups with Wave 4)
  - Message: `chore(tests): setup Playwright and Vitest test infrastructure`
  - Files: `playwright.config.ts`, `vitest.config.ts`, `package.json`
  - Pre-commit: `bun run test:unit -- --run`

- [x] 18. **Write E2E Tests for postMessage Protocol**

  **What to do**:
  - Create `tests/wallet-protocol.spec.ts`:
    - Test valid `WALLET_SIGN` round-trip (request → approval → response)
    - Test invalid origin message is ignored
    - Test malformed message is rejected by Zod schema
    - Test timeout handling (no response within 30s)
    - Test `requestId` correlation (mismatched requestId is rejected)
    - Test unknown protocol version is rejected
    - Test `WALLET_READY` handshake
  - Each test: start dev server, open /wallet, send postMessage, assert response
  - Use Playwright's `page.evaluate()` to send postMessage from test context

  **Must NOT do**:
  - Do NOT test actual WebAuthn PRF (requires real browser + authenticator)
  - Do NOT test Solana transaction submission (separate test suite)
  - Do NOT add complex test fixtures

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: E2E tests for critical security protocol, need thorough coverage
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 16, 17, 19)
  - **Blocks**: Task 20
  - **Blocked By**: Tasks 4, 9, 17

  **References**:
  - `src/frontend/wallet/protocol.ts` — Message types and schemas
  - `src/frontend/wallet/iframe/messaging.ts` — Iframe handler
  - Playwright docs: `page.evaluate()`, `frame.evaluate()` for postMessage testing

  **Acceptance Criteria**:
  - [ ] All protocol message types have test coverage
  - [ ] Invalid origin test passes
  - [ ] Malformed message test passes
  - [ ] Timeout test passes
  - [ ] requestId correlation test passes
  - [ ] All tests run in CI (`bun run test:e2e`)

  **QA Scenarios**:

  ```
  Scenario: E2E protocol tests pass
    Tool: Bash (Playwright CLI)
    Preconditions: Dev server running, tests written
    Steps:
      1. bun run test:e2e tests/wallet-protocol.spec.ts
      2. Assert all tests pass (exit code 0)
      3. Assert no flaky tests (run 3 times, all pass)
    Expected Result: 100% protocol test pass rate
    Evidence: .sisyphus/evidence/task-18-protocol-tests.txt
  ```

  **Evidence to Capture**:
  - [ ] Terminal output of passing tests

  **Commit**: YES (groups with Wave 4)
  - Message: `test(wallet): add e2e tests for postMessage protocol`
  - Files: `tests/wallet-protocol.spec.ts`
  - Pre-commit: `bun run test:e2e tests/wallet-protocol.spec.ts`

- [x] 19. **Write E2E Tests for Signing Flow** (SKIPPED - user requested skip testing)

  **What to do**:
  - Create `tests/wallet-signing.spec.ts`:
    - Test wallet connection flow (Better Auth login → connect wallet → derive address)
    - Test transaction signing approval UI (initiate → approve → receive signature)
    - Test transaction rejection (initiate → reject → error response)
    - Test deterministic address (same user = same address across sessions)
    - Test iframe isolation (parent cannot access iframe's internal state)
    - Test buffer clearing (verify PRF output is cleared after derivation)
  - Mock or use test passkey for WebAuthn PRF steps (Playwright may need special handling for WebAuthn)
  - Document WebAuthn testing requirements (Chrome 132+, authenticator support)

  **Must NOT do**:
  - Do NOT test on mainnet (devnet only)
  - Do NOT test with real funds
  - Do NOT skip WebAuthn mocking if real PRF is unavailable in test environment

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex E2E tests covering full user flow
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 16, 17, 18)
  - **Blocks**: Task 20
  - **Blocked By**: Tasks 16, 17

  **References**:
  - `src/frontend/components/wallet/SendSolForm.tsx` — Transaction creation UI
  - `src/frontend/wallet/iframe/` — Iframe components
  - Playwright docs: WebAuthn testing support

  **Acceptance Criteria**:
  - [ ] Wallet connection test passes
  - [ ] Transaction signing test passes
  - [ ] Transaction rejection test passes
  - [ ] Deterministic address test passes
  - [ ] Iframe isolation test passes
  - [ ] Buffer clearing test passes

  **QA Scenarios**:

  ```
  Scenario: Signing flow e2e tests pass
    Tool: Bash (Playwright CLI)
    Preconditions: Dev server running, tests written
    Steps:
      1. bun run test:e2e tests/wallet-signing.spec.ts
      2. Assert all tests pass (exit code 0)
      3. Run 3 times to check for flakiness
    Expected Result: 100% signing flow test pass rate
    Evidence: .sisyphus/evidence/task-19-signing-tests.txt
  ```

  **Evidence to Capture**:
  - [ ] Terminal output of passing tests

  **Commit**: YES (groups with Wave 4)
  - Message: `test(wallet): add e2e tests for signing flow`
  - Files: `tests/wallet-signing.spec.ts`
  - Pre-commit: `bun run test:e2e tests/wallet-signing.spec.ts`

- [x] 20. **Security Audit (Buffer Clearing, Origin Validation, Key Exposure)**

  **What to do**:
  - Run automated security checks:
    - `grep -r "localStorage\|sessionStorage\|indexedDB" src/frontend/wallet/iframe/` — Assert no key persistence
    - `grep -r "window\.keypair\|window\.privateKey" src/frontend/wallet/iframe/` — Assert no key exposure on window
    - `grep -r "event.origin" src/frontend/wallet/iframe/` — Assert origin validation exists
    - `grep -r "requestId" src/frontend/wallet/` — Assert requestId correlation exists
    - `grep -r "prfBytes\.fill(0)\|seed\.fill(0)" src/frontend/crypto/prf-solana.ts` — Assert buffer clearing exists
  - Manual review:
    - Verify iframe `sandbox` attributes are correct
    - Verify CSP headers are strict (no `unsafe-inline`)
    - Verify approval UI is triggered for EVERY sign request
    - Verify private key is NOT exported from `key-derivation.ts`
  - Document findings in security checklist

  **Must NOT do**:
  - Do NOT fix security issues in this task (that should be done during implementation)
  - Do NOT add new security features (audit only)
  - Do NOT skip any check

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Security audit, requires thoroughness and attention to detail
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 21, 22, 23)
  - **Blocks**: Task 21
  - **Blocked By**: Tasks 18, 19

  **References**:
  - `src/frontend/wallet/iframe/` — All iframe source files
  - `src/frontend/crypto/prf-solana.ts` — Derivation utility
  - Security checklist from Metis review

  **Acceptance Criteria**:
  - [ ] No `localStorage`/`sessionStorage`/`indexedDB` usage in iframe code
  - [ ] No `window.keypair` or `window.privateKey` exposure
  - [ ] Origin validation present in every postMessage handler
  - [ ] requestId correlation present in protocol
  - [ ] Buffer clearing present in key derivation
  - [ ] Approval UI triggered for every WALLET_SIGN request
  - [ ] Security checklist document created

  **QA Scenarios**:

  ```
  Scenario: Security audit passes
    Tool: Bash (grep + manual review)
    Preconditions: All implementation complete
    Steps:
      1. Run grep checks for persistence, exposure, validation
      2. Read iframe source files manually
      3. Verify sandbox attributes and CSP headers
      4. Document all findings in checklist
      5. Assert zero critical security issues
    Expected Result: All security checks pass
    Evidence: .sisyphus/evidence/task-20-security-audit.md
  ```

  **Evidence to Capture**:
  - [ ] Security checklist document
  - [ ] grep output showing no violations

  **Commit**: YES (groups with Wave 5)
  - Message: `security(wallet): comprehensive security audit of iframe wallet`
  - Files: `.sisyphus/evidence/task-20-security-audit.md`
  - Pre-commit: N/A (audit only)

- [x] 21. **Error Handling + Edge Cases**

  **What to do**:
  - Review and harden error handling:
    - WebAuthn not supported → clear error message + disable wallet button
    - PRF not supported by authenticator → explain PRF requirement + suggest Chrome 132+
    - User cancels WebAuthn prompt → "Authentication cancelled" message
    - Iframe fails to load → "Wallet unavailable" message + retry button
    - Transaction serialization fails → descriptive error to parent
    - Insufficient balance → error BEFORE sending to iframe (parent simulates)
    - Network failure submitting to devnet → retry logic + error message
    - Iframe timeout during signing → parent handles gracefully
    - Multiple simultaneous sign requests → queue or reject with clear error
  - Add typed error classes: `WalletError`, `PrfNotSupportedError`, `TimeoutError`, etc.
  - Ensure all errors have user-friendly messages (not just stack traces)

  **Must NOT do**:
  - Do NOT add generic `try/catch` that swallow errors
  - Do NOT show raw error codes to users
  - Do NOT add complex retry logic with exponential backoff (simple retry is fine)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Edge case handling, error states, user experience
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 20, 22, 23)
  - **Blocks**: Task 22
  - **Blocked By**: Tasks 20

  **References**:
  - `src/frontend/wallet/client.ts` — Parent client error handling
  - `src/frontend/wallet/iframe/messaging.ts` — Iframe error handling
  - `src/frontend/wallet/iframe/webauthn-prf.ts` — WebAuthn error handling

  **Acceptance Criteria**:
  - [ ] All listed edge cases have explicit handling
  - [ ] Typed error classes exist and are used consistently
  - [ ] User sees friendly error messages (not stack traces)
  - [ ] Errors are logged to console for debugging
  - [ ] No unhandled promise rejections

  **QA Scenarios**:

  ```
  Scenario: WebAuthn not supported shows friendly error
    Tool: Playwright
    Preconditions: Browser without WebAuthn (or mocked)
    Steps:
      1. Click "Connect Embedded Wallet"
      2. Assert error message: "WebAuthn is not supported in this browser"
      3. Assert wallet button is disabled or shows retry option
    Expected Result: Graceful degradation with clear messaging
    Evidence: .sisyphus/evidence/task-21-webauthn-error.png

  Scenario: Iframe load failure handled gracefully
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Block /wallet route (simulate network failure)
      2. Click "Connect Embedded Wallet"
      3. Assert error: "Wallet unavailable. Please try again."
      4. Assert retry button is visible
    Expected Result: Parent handles iframe failure
    Evidence: .sisyphus/evidence/task-21-iframe-error.png
  ```

  **Evidence to Capture**:
  - [ ] Playwright screenshots of error states
  - [ ] Console logs showing error handling

  **Commit**: YES (groups with Wave 5)
  - Message: `feat(wallet): add comprehensive error handling for edge cases`
  - Files: `src/frontend/wallet/errors.ts`, various error handling updates
  - Pre-commit: `bun run build`

- [x] 22. **Performance Optimization**

  **What to do**:
  - Measure and optimize:
    - Iframe load time: target < 500ms (bundle size, lazy loading)
    - postMessage round-trip: target < 200ms (sign request → response)
    - Wallet derivation: target < 100ms (PRF → keypair)
  - Optimization actions:
    - Ensure iframe bundle is minimal (only wallet code, no heavy deps)
    - Use `React.lazy` or dynamic imports for wallet components
    - Preload iframe when user hovers over "Connect" button
    - Minimize re-renders in approval UI
    - Use `useCallback` and `useMemo` where appropriate
  - Document measured performance in evidence

  **Must NOT do**:
  - Do NOT add caching of key material (security > performance)
  - Do NOT skip WebAuthn prompt for "faster" UX (security requirement)
  - Do NOT add unnecessary dependencies

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Performance tweaks, measurement, small optimizations
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 20, 21, 23)
  - **Blocks**: Task 23
  - **Blocked By**: Tasks 21

  **References**:
  - `src/app/wallet/page.tsx` — Iframe route
  - React docs: `React.lazy`, `Suspense`, `useCallback`, `useMemo`
  - Next.js docs: Dynamic imports, bundle optimization

  **Acceptance Criteria**:
  - [ ] Iframe loads in < 500ms (measured via Playwright or browser devtools)
  - [ ] postMessage round-trip completes in < 200ms (measured)
  - [ ] No unnecessary re-renders in approval UI (React DevTools Profiler)
  - [ ] Wallet bundle size is minimal (check with `next bundle-analyzer` if available)

  **QA Scenarios**:

  ```
  Scenario: Performance meets targets
    Tool: Playwright + Browser Devtools
    Preconditions: Production build or optimized dev build
    Steps:
      1. Measure iframe load time: navigate to /wallet, record load event
      2. Assert load time < 500ms
      3. Measure postMessage round-trip: send WALLET_SIGN, record response time
      4. Assert round-trip < 200ms
      5. Check bundle size: list files in .next/static/chunks/ for wallet route
      6. Assert wallet chunk is < 100KB gzipped
    Expected Result: All performance targets met
    Evidence: .sisyphus/evidence/task-22-performance.txt
  ```

  **Evidence to Capture**:
  - [ ] Performance measurement logs
  - [ ] Bundle size analysis

  **Commit**: YES (groups with Wave 5)
  - Message: `perf(wallet): optimize iframe load time and postMessage latency`
  - Files: `src/app/wallet/page.tsx`, `src/frontend/wallet/iframe/` (optimization changes)
  - Pre-commit: `bun run build`

- [x] 23. **Code Cleanup + Lint + Typecheck**

  **What to do**:
  - Run linter and fix all issues: `bun run lint`
  - Run type checker: `bun run build` (Next.js type checking via `tsc`)
  - Remove any unused imports or variables
  - Remove console.log statements from production code (keep only in error handlers)
  - Remove commented-out code
  - Ensure consistent naming conventions (camelCase for vars, PascalCase for components)
  - Add minimal inline comments for crypto-critical code only
  - Run formatter: `bun run format`
  - Verify no TypeScript `any` types (use `unknown` if needed)
  - Final `bun run build` must pass cleanly

  **Must NOT do**:
  - Do NOT add JSDoc to every function (minimal comments only)
  - Do NOT refactor working code "just because"
  - Do NOT change existing working code outside wallet scope

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Cleanup and verification, mechanical checks
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 20, 21, 22)
  - **Blocks**: F1-F4 (Final Verification)
  - **Blocked By**: Tasks 22

  **References**:
  - `package.json` scripts: `lint`, `format`, `build`
  - Project eslint config
  - Project prettier/biome config

  **Acceptance Criteria**:
  - [ ] `bun run lint` passes with zero errors
  - [ ] `bun run build` passes with zero type errors
  - [ ] No `console.log` in production paths (only error handlers)
  - [ ] No unused imports
  - [ ] No commented-out code
  - [ ] No `any` types in new wallet code

  **QA Scenarios**:

  ```
  Scenario: Build and lint pass cleanly
    Tool: Bash
    Preconditions: All implementation complete
    Steps:
      1. bun run lint
      2. Assert exit code 0
      3. bun run build
      4. Assert exit code 0
      5. grep -r "console.log" src/frontend/wallet/ --include="*.ts" --include="*.tsx"
      6. Assert no console.log in wallet source (except error handlers)
    Expected Result: Clean build, no lint errors, no debug logging
    Evidence: .sisyphus/evidence/task-23-cleanup.txt
  ```

  **Evidence to Capture**:
  - [ ] Terminal output of passing lint and build
  - [ ] grep output showing no console.log

  **Commit**: YES (groups with Wave 5)
  - Message: `refactor(wallet): cleanup, lint, and typecheck pass`
  - Files: All wallet source files (formatting fixes)
  - Pre-commit: `bun run lint && bun run build`

> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.**

- [x] F1. **Plan Compliance Audit** — `oracle` ✅

  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.

  **Checklist**:
  - [ ] PRF enabled in Better Auth config (`src/server/auth/auth.ts`)
  - [ ] `prf-solana.ts` fixed (salt connected, placeholders replaced, buffer clearing)
  - [ ] Iframe route exists (`src/app/wallet/page.tsx`) and is client-only
  - [ ] postMessage protocol defined (`src/frontend/wallet/protocol.ts`) with Zod validation
  - [ ] WebAuthn PRF integration (`src/frontend/wallet/iframe/webauthn-prf.ts`)
  - [ ] Key derivation in iframe (`src/frontend/wallet/iframe/key-derivation.ts`)
  - [ ] Approval UI (`src/frontend/wallet/iframe/components/ApprovalUI.tsx`)
  - [ ] postMessage handler with origin validation (`src/frontend/wallet/iframe/messaging.ts`)
  - [ ] Parent client (`src/frontend/wallet/client.ts`)
  - [ ] Better Auth integration in parent app
  - [ ] Wallet UI components (button, card, status)
  - [ ] End-to-end signing flow works (create → sign → submit)
  - [ ] Playwright tests pass (`tests/wallet-protocol.spec.ts`, `tests/wallet-signing.spec.ts`)
  - [ ] Security audit passes (no key persistence, no key exposure, origin validation)
  - [ ] Build and lint pass cleanly

  **Reject if**:
  - Any "Must Have" is missing
  - Any "Must NOT Have" is present (e.g., localStorage usage, key exposure)
  - Evidence files are missing for critical QA scenarios

  **Output**: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

  **Evidence**: `.sisyphus/evidence/final-plan-compliance.md`

- [x] F2. **Code Quality Review** — `unspecified-high` ✅

  Run `tsc --noEmit` + linter + `bun test:unit` + `bun test:e2e`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, `console.log` in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (`data`/`result`/`item`/`temp`).

  **Checklist**:
  - [ ] `tsc --noEmit` passes
  - [ ] `bun run lint` passes
  - [ ] Unit tests pass (`bun run test:unit`)
  - [ ] E2E tests pass (`bun run test:e2e`)
  - [ ] No `as any` in new wallet code
  - [ ] No `@ts-ignore` in new wallet code
  - [ ] No empty catch blocks
  - [ ] No `console.log` in production paths
  - [ ] No unused imports
  - [ ] No generic variable names in crypto-critical code
  - [ ] Functions have clear, descriptive names

  **Output**: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Unit Tests [N pass/N fail] | E2E Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

  **Evidence**: `.sisyphus/evidence/final-code-quality.md`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill) ✅

  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.

  **Scenarios to test**:
  - [ ] Full user flow: Register passkey with PRF → Connect embedded wallet → Check address → Send SOL → Approve → Confirm on devnet
  - [ ] Rejection flow: Send SOL → Reject → Assert no transaction submitted
  - [ ] Coexistence: Connect Phantom + Connect Embedded → Both addresses visible → No conflicts
  - [ ] Determinism: Log out → Log in → Connect wallet → Same address
  - [ ] Iframe isolation: Parent JavaScript cannot access iframe's keypair
  - [ ] Error cases: WebAuthn not supported → Graceful error
  - [ ] Timeout: Sign request → No approval → Timeout error
  - [ ] Security: Inspect iframe → No key material in localStorage/sessionStorage

  **Output**: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

  **Evidence**: `.sisyphus/evidence/final-qa/`

- [x] F4. **Scope Fidelity Check** — `deep` ✅

  For each task: read "What to do", read actual diff (`git log/diff`). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.

  **Checklist**:
  - [ ] Task 1-23 all have corresponding implementation
  - [ ] No recovery flow implemented (out of scope)
  - [ ] No EIP-1193 connector (out of scope)
  - [ ] No SPL token support (out of scope)
  - [ ] No subdomain isolation (out of scope)
  - [ ] Existing Phantom/Solflare connectors untouched
  - [ ] No new DB tables added
  - [ ] No server-side wallet derivation
  - [ ] No key persistence in storage
  - [ ] Each task's files match its scope

  **Output**: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

  **Evidence**: `.sisyphus/evidence/final-scope-fidelity.md`

> **Present consolidated F1-F4 results to user and get explicit "okay" before marking complete.**
> **If any F1-F4 rejects: fix → re-run → present again → wait for okay.**

---

## Final Verification Wave

---

## Commit Strategy

- **Wave 1**: `feat(wallet): enable PRF and scaffold iframe infrastructure`
- **Wave 2**: `feat(wallet): implement iframe wallet with WebAuthn PRF`
- **Wave 3**: `feat(wallet): integrate embedded wallet into parent app`
- **Wave 4**: `feat(wallet): end-to-end signing flow and e2e tests`
- **Wave 5**: `refactor(wallet): security hardening and polish`

---

## Success Criteria

### Verification Commands

```bash
# PRF enabled in Better Auth
curl -X POST http://localhost:3000/api/auth/passkey/register \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}' | grep -q "prf"

# Iframe loads
# Playwright: navigate to /wallet, assert iframe is present

# Deterministic wallet
echo "Same PRF + same salt = same address" && \
  node -e "const {keypairFromPrf} = require('./src/frontend/crypto/prf-solana'); console.log('TODO')"

# Transaction signing e2e
# Playwright: full flow from connect wallet to sign tx to devnet confirmation

# Security audit
# grep -r "localStorage.*key" src/frontend/wallet/ || echo "PASS: No key persistence"
# grep -r "window\\.keypair" src/frontend/wallet/ || echo "PASS: No key exposure"
```

### Final Checklist

- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All Playwright tests pass
- [ ] Security audit passes
- [ ] Devnet transaction succeeds

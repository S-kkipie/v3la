# Issues - WebAuthn PRF Wallet

## Known Blockers

- [ ] **BLOCKER**: Better Auth passkey plugin may not support PRF extension natively. Need to verify.
- [ ] **BLOCKER**: Chrome 132+ required for PRF. Need feature detection and fallback UX.
- [ ] **BLOCKER**: WebAuthn PRF testing in Playwright may require special setup or mocking.

## Potential Issues

- [ ] PRF output size may vary by authenticator. HKDF handles this but need to verify.
- [ ] Same-origin iframe means parent CAN access iframe's window object. Need defense in depth.
- [ ] `@noble/hashes/hkdf.js` import may fail if `.js` extension not used in ESM context.
- [ ] Next.js 16 App Router may SSR iframe route despite `"use client"`. Need `dynamic({ ssr: false })`.

## Resolved Issues

- None yet

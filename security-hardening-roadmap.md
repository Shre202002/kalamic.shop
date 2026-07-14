# Kalamic.shop Complete Security-Hardening Roadmap

**Current branch:** `codex/security-hardening`
**Goal:** Reach a defensible production-security sign-off for authentication, authorization, payments, abuse resistance, data protection, and operational monitoring.

> “Complete protection” cannot mean impossible to hack. The target is that documented trust boundaries are enforced, abuse is rate-limited, payment state is server-authoritative, and the controls are proven in staging and monitored in production.

## Current baseline

- 9 of 16 checklist items are fully complete or passed in source review.
- 4 items are partially remediated.
- 3 items remain pending validation or coverage.
- `npm run typecheck` passes.
- `npm run build` passes with expected local missing-environment warnings.
- No production attack testing has been performed.

The latest branch update additionally implements a Mongo-backed distributed limiter for OTP, checkout, phone checks, and uploads, plus baseline CSP and browser security headers. These controls still need staging validation and production configuration review.

Abandoned initiated orders now have a protected cleanup endpoint scheduled every 15 minutes, and a repeatable `npm run security:smoke` script is included for deployment verification.

## Priority legend

- **P0:** Must complete before accepting meaningful production traffic.
- **P1:** Must complete before declaring the platform security-hardened.
- **P2:** Ongoing hardening and operational maturity.

## Phase 1 — P0 identity and authorization closure

### 1.1 Profile and account binding

- [x] Derive the profile-sync Firebase UID from the verified server session.
- [x] Reject an email already bound to a different Firebase UID.
- [ ] Add staging tests for first login, repeat login, mismatched UID, mismatched email, and revoked token.
- [ ] Confirm account-linking policy for legitimate email/provider migration.

**Acceptance:** An attacker cannot create or update a profile using another customer’s email, UID, or verification flags.

### 1.2 User and order ownership

- [x] Enforce session ownership on order detail and pending-order APIs.
- [x] Enforce session ownership in profile, wishlist, and user-order server actions.
- [ ] Test cross-user access with two staging accounts and random order IDs.
- [ ] Verify 401/403 responses do not disclose order existence or PII.

**Acceptance:** Every customer-data read or mutation is scoped to the authenticated UID on the server.

### 1.3 Admin authorization

- [x] Derive admin identity from the server session instead of request parameters.
- [x] Protect admin server actions and admin API routes with role checks.
- [ ] Review every remaining `adminId`, `userId`, or actor parameter under `src/app/api/admin` and `src/lib/actions`.
- [ ] Add negative tests for buyer, support, admin, and super-admin roles.
- [ ] Confirm role changes are audited and cannot elevate the caller themselves.

**Acceptance:** A buyer cannot invoke, replay, or alter any admin operation by changing a request ID.

## Phase 2 — P0 payment and checkout integrity

### 2.1 Razorpay verification and webhooks

- [x] Keep server-side HMAC verification using the Razorpay secret.
- [x] Bind the callback to the server-stored gateway order ID.
- [x] Require exact amount and currency and captured payment state.
- [x] Verify webhook signatures against the raw request body.
- [x] Make payment finalization idempotent.
- [ ] Add staging tests for forged signature, wrong amount, wrong currency, wrong order ID, duplicate webhook, delayed webhook, and out-of-order webhook.
- [ ] Confirm Razorpay webhook secret is stored only in server-side deployment variables.

**Acceptance:** No browser-controlled field can mark an order paid, and duplicate callbacks cannot duplicate side effects.

### 2.2 Checkout idempotency and replay resistance

- [x] Require and persist an `Idempotency-Key` for checkout creation.
- [x] Return the existing pending gateway order for a repeated key.
- [ ] Add a distributed rate limit per user, IP, and route.
- [ ] Add a maximum number of pending orders per user.
- [ ] Expire or cancel abandoned pending orders.
- [ ] Add staging tests for retries, concurrent identical requests, and concurrent different requests.

**Acceptance:** Network retries do not create duplicate gateway orders, and automated requests cannot create unbounded unpaid orders.

### 2.3 Inventory and promotion integrity

- [x] Atomically reserve tracked inventory during checkout creation.
- [x] Release inventory when order creation or payment fails.
- [x] Prevent duplicate release with an order-level release flag.
- [x] Make promotion usage increment conditional on the configured limit.
- [ ] Add reservation expiry for abandoned orders.
- [ ] Add transactional/concurrency tests for stock and max-use promotions.
- [ ] Define policy for a captured payment when a promotion limit is exhausted during finalization.

**Acceptance:** Concurrent checkout cannot oversell stock or exceed a promotion limit, and abandoned reservations do not permanently reduce availability.

## Phase 3 — P0/P1 authentication and OTP abuse controls

### 3.1 OTP correctness

- [x] Use cryptographic random OTP generation.
- [x] Stop logging OTP values.
- [x] Enforce a five-attempt ceiling.
- [ ] Use a distributed rate limiter for send and verify endpoints.
- [ ] Add per-account, per-IP, and global email/SMS quotas.
- [ ] Return enumeration-resistant responses for login and registration.
- [ ] Ensure successful OTP verification produces a single-use, server-bound authentication transition.
- [ ] Review all email and phone OTP routes, not only login verification.

**Acceptance:** OTP guessing, resend spam, account enumeration, and distributed bypass attempts are rate-limited and test-covered.

### 3.2 Session lifecycle

- [x] Enable revocation-aware Firebase token verification.
- [ ] Test logout, revoked token, expired token, token refresh, and concurrent-session behavior in staging.
- [ ] Confirm session cookies use `HttpOnly`, `Secure`, `SameSite`, and an appropriate lifetime in production.
- [ ] Add explicit session invalidation after sensitive account changes.

**Acceptance:** Revoked or expired credentials cannot call protected APIs.

## Phase 4 — P1 file, input, and data protection

### 4.1 Upload security

- [x] Require an authorized admin for ImageKit server uploads.
- [x] Allow-list upload folders.
- [ ] Add per-admin and per-IP upload quotas.
- [ ] Validate file content/magic bytes, not only MIME type and extension.
- [ ] Add image decompression-bomb and malformed-file tests.
- [ ] Confirm uploaded filenames and metadata cannot inject HTML, scripts, or paths.

**Acceptance:** Unauthorized users cannot consume ImageKit resources or upload executable/malicious content.

### 4.2 Request and response hardening

- [ ] Review all API inputs with schemas and maximum lengths.
- [ ] Remove sensitive data from error responses and logs.
- [ ] Add security headers: CSP, HSTS, frame protection, content-type protection, and referrer policy.
- [ ] Confirm CORS and origin behavior for every API route.
- [ ] Review SSRF, open redirects, unsafe URL fetches, and HTML rendering paths.

**Acceptance:** Inputs are bounded and malformed requests cannot cause data disclosure, script execution, or resource exhaustion.

## Phase 5 — P1 deployment and secrets

- [ ] Rotate any credential that appeared in local `.env` files, logs, screenshots, or commits.
- [ ] Verify Razorpay secret, webhook secret, Firebase private key, MongoDB URI, and ImageKit private key are server-only.
- [ ] Remove `NEXT_PUBLIC_` prefixes from values that are actually secret.
- [ ] Enable Vercel deployment protection and environment separation for preview/production.
- [ ] Configure WAF/bot protection and rate limits for auth, OTP, checkout, upload, and webhook routes.
- [ ] Confirm production logs redact tokens, OTPs, payment secrets, addresses, and full phone numbers.
- [ ] Set database least-privilege credentials and backups.

**Acceptance:** A client bundle, preview deployment, log viewer, or repository checkout cannot reveal a usable secret.

## Phase 6 — P1 staging verification

Create a staging environment with test credentials and run:

- [ ] Authentication matrix: buyer/admin/super-admin, valid/expired/revoked tokens.
- [ ] Authorization matrix: own/other order, own/other profile, every admin route/action.
- [ ] Payment matrix: valid payment, forged signature, changed amount, changed currency, wrong order, duplicate webhook, delayed webhook.
- [ ] Replay matrix: repeated checkout, repeated verify, repeated webhook, repeated refund/status request.
- [ ] Concurrency matrix: same SKU, same promo, same idempotency key, different idempotency keys.
- [ ] Abuse matrix: OTP brute force, OTP resend spam, upload spam, checkout spam, oversized payloads.
- [ ] Privacy matrix: error responses, logs, order endpoints, admin exports, and analytics payloads.

**Acceptance:** Every negative test is rejected with the intended status, every legitimate flow succeeds, and no high/critical issue remains unexplained.

## Phase 7 — P1 final security review and release gate

- [ ] Complete the remaining deferred source-review rows.
- [ ] Rerun the security scan against the exact release commit.
- [ ] Review the final diff for unrelated changes and generated artifacts.
- [ ] Attach test output, scan report, threat model, and deployment configuration evidence.
- [ ] Obtain a human review/approval before merging.
- [ ] Deploy to production using a controlled rollout.
- [ ] Monitor payment failures, auth failures, rate-limit events, duplicate orders, and upload abuse for 24–72 hours.

**Release gate:** Do not label the release “security-hardened” while any P0 task is open, any critical/high finding is unexplained, or staging evidence is missing.

## Phase 8 — P2 ongoing operations

- [ ] Monthly dependency and secret-rotation review.
- [ ] Quarterly authorization and payment regression suite.
- [ ] Alerting for unusual OTP volume, order creation, payment verification failures, and admin mutations.
- [ ] Incident-response runbook for compromised sessions, fraudulent payments, leaked secrets, and inventory corruption.
- [ ] Periodic backup-restore and webhook-replay drills.

## Evidence files

- [Security checklist report](security-checklist-report.md)
- [Detailed security scan](security-evidence/report.md)
- [Worklist closure](security-evidence/artifacts/02_discovery/worklist-closure.json)
- [Candidate ledger index](security-evidence/artifacts/05_findings/candidate-ledger-index.json)

## Final definition of done

The roadmap is complete only when all P0/P1 checkboxes are complete, staging tests pass, the exact production commit has a clean security scan, secrets and WAF settings are verified, and a human reviewer approves the release.

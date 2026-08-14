# Kalamic.shop Security Checklist Report

**Date:** 14 August 2026
**Repository:** `kalamic.shop`
**Remediation branch:** `codex/security-hardening`
**Status:** Remediated batch verified; full security sign-off still pending

## Executive summary

The first security-hardening batch has been implemented and verified with type-checking, production compilation, and diff validation. Payment signature and amount validation were already present and remain intact.

This is **not** a claim that every security concern has passed. Distributed abuse controls, staging integration tests, live replay/concurrency tests, and the remaining deferred source-review rows still require follow-up.

### Latest remediation update

The current branch also adds a Mongo-backed distributed limiter for OTP, checkout, phone checks, and uploads; security response headers including CSP, HSTS, frame protection, and content-type protection; and stricter profile provisioning that prevents silent email-to-UID rebinding. These changes pass type-checking and production compilation, but require staging tests with real services before they can be marked fully verified.

The latest batch also adds a protected scheduled cleanup route for abandoned inventory reservations, a Vercel cron schedule, and a `security:smoke` test script for unauthenticated boundaries and response headers.

The current hardening pass adds distributed API limiting to comments, contact, newsletter, charge calculation, promo validation, payment verification, and Razorpay webhooks. It also removes request-body Firebase tokens from comments, escapes contact-form content before email rendering, bounds numeric/string inputs, and strips Mongo operator/path keys from admin updates.

## Checklist

| Area | Status | Evidence / notes |
|---|---|---|
| Razorpay signature verification | Passed in source review | Server-side HMAC verification remains in the payment verification path. |
| Razorpay amount, currency, order binding | Passed in source review | Server-stored order and exact amount/currency checks remain enforced. |
| Webhook authenticity and duplicate handling | Passed in source review | Raw-body signature verification and atomic payment finalization are present. |
| Session token revocation | Fixed in branch | Firebase token verification now uses revocation-aware verification. |
| Profile/Firebase UID rebinding | Fixed in branch | Profile sync derives UID from the authenticated server session and rejects mismatched email ownership. |
| Order ownership / IDOR | Fixed in branch | Order detail and pending-order APIs bind access to the authenticated UID. |
| Admin authorization | Fixed in branch | Admin actions and admin APIs no longer trust caller-supplied admin IDs. |
| Upload authorization | Fixed in branch | ImageKit uploads require an authorized admin and use an allow-listed folder. |
| OTP randomness and logging | Fixed in branch | Cryptographic randomness is used and OTP values are no longer logged. |
| OTP attempt ceiling | Fixed in branch | Five-attempt ceiling and distributed per-IP/account throttling are enforced. |
| Checkout duplicate-order abuse | Fixed in branch | Idempotency keys and distributed checkout rate limiting are enforced; concurrency still needs staging verification. |
| Inventory race | Partially fixed | Atomic stock reservation and failure release were added; abandoned reservation expiry remains. |
| Promotion race | Partially fixed | Usage increment is conditional and atomic; end-to-end concurrent validation is still required. |
| Payment failure inventory recovery | Fixed in branch | Failed payment paths release reservations once. |
| Production integration tests | Not run | Requires staging credentials/services for MongoDB, Firebase, and Razorpay. |
| Live replay/concurrency/abuse tests | Not run | No destructive or production attack testing was performed. |
| Full source-review coverage | Incomplete | The detailed scan explicitly deferred 168 of 193 review rows. |

## Verification performed

- `npm run typecheck` — passed.
- `npm run build` — passed; local build emitted expected missing-environment warnings because production credentials are not present in this checkout.
- `git diff --check` — passed.
- Generated sitemap changes were removed from the remediation patch.

## Remaining risks before production sign-off

1. Configure and verify Vercel WAF/rate-limit rules and Preview-scoped environment variables.
2. Run authenticated staging tests for ownership, admin-role, replay, duplicate, and race conditions.
3. Complete the deferred 168-row source review.
4. Rotate any credentials that may have appeared in local environment files and confirm only server-side secrets are deployed.

## Detailed evidence

- [Detailed security scan report](security-evidence/report.md)
- [Worklist closure](security-evidence/artifacts/02_discovery/worklist-closure.json)
- [Candidate ledger index](security-evidence/artifacts/05_findings/candidate-ledger-index.json)

## Final conclusion

The implemented remediation batch is build-verified and materially improves authentication, authorization, payment-adjacent abuse resistance, and inventory integrity. The site should **not** yet be described as fully security-certified until the remaining distributed controls, staging tests, live abuse tests, and deferred review rows are completed.

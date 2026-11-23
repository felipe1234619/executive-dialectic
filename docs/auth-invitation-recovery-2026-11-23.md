# Auth invitation incident and recovery runbook

Date: 2026-11-23. Status: VERIFIED ROOT CAUSE / NO PRODUCTION CONFIG CHANGES.

## Observed
- Screenshot of Supabase Authentication > URL Configuration: default Site URL is `http://localhost:3000`; redirect allowlist is empty.
- Invitation on the founder's Proton mailbox redirected to `localhost:3000/#error=access_denied&error_code=otp_expired`.
- Read-only database verification: `auth.users` contains verified `felipe.carval@proton.me` with a sign-in timestamp. This does **not** establish a current authenticated browser session for Executive Dialectic.
- Correct email: `felipe.carval@proton.me` (not `felipecarval@proton.me`).
- No JCE organization or ADMIN membership provisioned.

## Diagnosis
The `localhost` destination follows directly from the default Site URL. The `otp_expired` fragment is a distinct token verification failure (expired, already consumed, or invalid). The screenshots alone do not establish which OTP failure mechanism occurred. A confirmed user row does not prove the application's callback was completed.

## Recovery sequence
1. **Do not** delete or re-invite the existing verified user, paste a one-time token into chat, or manually modify `auth.users`.
2. Preserve the existing The Executive Institute authentication flow. Audit existing Auth consumers before modifying the shared Site URL.
3. Implement a dedicated HTTPS authentication callback on an isolated preview host, not on the live editorial website. The callback must handle both PKCE code exchange and error fragments safely, avoid logging secrets, clear URL parameters, and not automatically authorize JCE access.
4. Test the callback with disposable users and a separate approved allowlisted exact HTTPS callback URL. Avoid wildcard redirect URLs and unapproved localhost defaults.
5. Configure the new exact callback in Auth Redirect URLs; use `redirectTo` explicitly from the Executive Dialectic sign-in flow. Do not change the global Site URL solely to fix the Executive Dialectic invitation.
6. Only after a tested redirect and session validation, enable the founder's login through a fresh, supported authentication flow (e.g. password recovery or OTP) and verify the resulting Auth UUID on the server. Reusing the expired invitation link is not a fix.
7. Enroll MFA and test sign-out/session revocation before granting ADMIN.
8. Provision the logical organization and membership via separately reviewed atomic privileged procedure, with audit and tenant isolation tests.

## Authorization invariants
- Public browser can hold a publishable key but never a service-role or database executor credential.
- Server derives actor UUID from verified access token and checks current membership.
- `auth.uid()` must be preserved in JCE executor context; never accept actor UUID from request body.
- All JCE writes remain disabled until live cross-organization E2E tests pass.

## Change record
No Supabase Auth settings were changed; the connected management tool does not expose Auth URL configuration mutation. No public website or DNS deployment performed. This document is a security-approved implementation plan, not a claim that the invitation is fixed.

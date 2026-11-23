# Live controlled Auth preview

Date: 2026-11-23

## Deployment
Supabase project: `the-executive-institute`
Edge Function: `executive-dialectic-auth-preview`
Status returned by Supabase: `ACTIVE`
Version: 1
JWT gateway verification: disabled **only because the endpoint receives unauthenticated Auth redirects**.

Exact HTTPS endpoint:
`https://ezwxcvpcrnsqajixwkvq.supabase.co/functions/v1/executive-dialectic-auth-preview`

## Security boundary
- No service-role key or database password is present.
- No JCE schema privilege or executor credential is present.
- No constitutional operation is exposed.
- Founder address is restricted in the deployed sign-in UI.
- The endpoint is `noindex`, no-store and frame-denied.
- A received callback code is not interpreted as institutional authorization.

## Remaining platform configuration
Supabase Auth Redirect URLs must contain the exact endpoint above before a fresh passwordless login can reliably return there.
The currently connected Supabase management interface does not expose Auth URL configuration mutation. This is a platform-management limitation, not an application design choice.

Do not change the shared global Site URL merely for Executive Dialectic. Add the exact redirect URL instead.

## Founder state at last read-only inspection
- Auth user: confirmed.
- Active sessions: 0.
- Verified MFA factors: 0.
- JCE organization: not provisioned.
- JCE membership: not provisioned.

## Acceptance sequence after allowlisting
1. Request a fresh sign-in link from the controlled preview.
2. Verify the resulting user UUID server-side.
3. Enroll MFA.
4. Confirm AAL2 and session revocation behavior.
5. Execute separately audited founder bootstrap.
6. Keep public institutional launch disabled until E2E acceptance.

# Founding identity and institutional correspondence — approved direction

Date: 2026-11-23. Status: IDENTITY DESIGN APPROVED; ACCOUNT CREATION NOT EXECUTED.

## Founding human identity
- Intended Supabase Auth sign-in email: `felipecarval@proton.me`.
- The mailbox is an **intended identifier**, not proof of mailbox control or verified human identity.
- The immutable application actor identifier must be the verified `auth.users.id` UUID, never the email address, browser-submitted actor ID or mutable `user_metadata`.
- Email verification must be completed by the mailbox holder. Enable MFA for the founder before privileged access.
- Do not create a privileged membership from an unverified email or assume Supabase dashboard account ownership proves JCE Auth identity.

## Institutional correspondence
- Reserved intended address: `founder@executivedialectic.com`.
- No mailbox, forwarding rule, MX/SPF/DKIM/DMARC, or domain email provider has been provisioned or verified.
- Institutional address is not an administrative identity or a substitute for personal authorization.

## Organization model
- Proposed JCE logical organization name: `Executive Dialectic`.
- Legal posture: founder acting as natural person; no claim of an incorporated entity.
- Initial membership: verified founder's UUID with `ADMIN` role after explicit audited bootstrap approval.
- UI designation `Founding Administrator` is a human-readable title; database role remains `ADMIN`.
- Future transfer of legal ownership requires a documented governance procedure; do not rewrite historical authorship.

## Account activation checklist
1. Review Auth project settings: email provider, verification requirement, site URL and redirect allowlist, signup policy, MFA and SMTP.
2. Use a supported Supabase Auth administrative invitation or signup workflow; **never directly INSERT into `auth.users`**.
3. Founder completes mailbox verification and MFA enrollment privately.
4. Trusted server obtains verified Auth UUID and checks current session state.
5. Independently review the privileged bootstrap procedure and append-only provisioning audit.
6. Only then create the logical organization and ADMIN membership in a controlled transaction.
7. Verify no cross-tenant read/write, revoked membership denial, and preservation of audit history.
8. No external pilot, public deployment or JCE writes before integration acceptance.

## Current verification
Read-only Supabase SQL inspection on 2026-11-23: 0 Auth users, 0 JCE organizations, 0 JCE memberships. No mutation performed.

## Outstanding technical constraint
The currently available Supabase integration does not provide an Auth Admin invite/create-user action or Auth configuration management action. Do not simulate a registration with SQL or claim an email was sent. The actual invitation/verification must use a supported authenticated administrative workflow after its settings are inspected.

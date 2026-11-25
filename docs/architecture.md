# Deployment and trust boundaries

1. **Public:** GitHub Pages hosts static HTML/CSS. All published assets are readable by anyone. No credentials are stored here.
2. **Identity:** Supabase Auth will authenticate users, but no auth integration is enabled in this scaffold.
3. **Authorization:** A future protected backend must verify token authenticity and membership before any JCE operation. Browser-supplied user IDs must never establish authority.
4. **Persistence:** Existing Supabase project, schema `jce_private`, with forced RLS, restricted `jce_executor`, immutable historical records and append-only audit.
5. **Release:** Public landing page may deploy independently; workspace stays disabled until integration tests and security review pass.

## Domain

- Intended canonical: `https://executivedialectic.com`.
- Optional future authenticated subdomain: `app.executivedialectic.com` only if separately configured and deployed.
- No DNS or GitHub Pages settings were changed when this scaffold was prepared.

# Founder identity preview

The Supabase-managed Edge Function hostname serves HTML GET responses as plain text. This static page handles the sign-in and PKCE callback on a browser-rendered origin.

## Local Safari verification

1. Check out `fix/founder-auth-preview` in the Executive Dialectic repository.
2. In the existing The Executive Institute Supabase project, add `http://localhost:8000/auth-preview/` as an exact redirect URL under Authentication → URL Configuration. Keep the existing Site URL and other redirect entries.
3. From the repository root run `python3 -m http.server 8000 --bind 127.0.0.1` and open `http://localhost:8000/auth-preview/` in Safari on that Mac.
4. Enter the founder address recorded in Supabase Auth and select **Send secure sign-in link**. Open the newest link using the same Safari profile. The preview requires that Auth returns a PKCE authorization code. A working PKCE flow ends with confirmation that Supabase Auth verified the session and email.
5. Stop the local server after testing. Remove the localhost allowlist entry when the local test window is over.

This preview calls Supabase Auth with the publishable key and disables automatic account creation. It verifies the session through Auth's getUser API. Any existing account can request its own link subject to the project's Auth settings. The page has no JCE credentials or organizational authorization. Identity verification, MFA enrollment, and the constitutional bootstrap are separate steps.

For a hosted test, use an access-controlled HTTPS origin, allowlist its exact preview URL, and repeat the test from the same browser profile. The existing session-check Edge Function currently has no cross-origin browser support. A hosted integration with it requires a same-origin server-side adapter or explicit restricted CORS. Keep this preview out of the public Pages deployment until homologation.

# Executive Dialectic™

Independent public website and future authenticated workspace for **executivedialectic.com**.

## Current state

- Static, responsive public website: `index.html`.
- Explicitly disabled workspace placeholder: `app.html`.
- GitHub Actions workflow for GitHub Pages.
- **No authentication, database connection, private JCE RPC, or user-facing write functionality is enabled.**
- JCE is already installed in the private `jce_private` schema of the existing The Executive Institute Supabase project; this repository does not expose it.

## Create repository and publish

1. Create a GitHub repository named `executive-dialectic` under `felipe1234619`. Choose visibility consistent with GitHub Pages availability on your plan; the **published site is public** regardless of repository visibility.
2. Unzip these files into the repository root, including the hidden `.github` directory and `.nojekyll`.
3. Commit and push to `main`.
4. In GitHub repository Settings → Pages, select **GitHub Actions** as Build and deployment source. Verify successful deployment to the default `github.io` URL before setting DNS.
5. Once the default URL works, create a `CNAME` file containing `executivedialectic.com`, configure GitHub Pages custom domain in Settings → Pages, and update DNS records with the registrar following GitHub's current instructions. Verify domain ownership and HTTPS. **Do not alter DNS until the deployment is verified.**

## Local preview

Run `python3 -m http.server 8000` from this directory and open `http://localhost:8000`.

## Security gates before enabling the workspace

- Choose an authenticated backend adapter (e.g. Supabase Edge Function) that verifies Supabase Auth tokens with server-side authorization, rejects forged actor IDs, checks organization membership, and exposes only approved operations.
- Do not put Supabase secret keys, service role keys or database credentials in GitHub Pages files or workflow output.
- Do not expose the `jce_private` schema through the Supabase Data API.
- Do not grant browser clients direct EXECUTE on private SECURITY DEFINER functions.
- Validate end-to-end authentication, tenant isolation, idempotency, revision conflicts, audit integrity and denial paths before enabling production access.
- Keep the Executive Institute editorial website and its existing public tables unchanged.

## Architecture

`GitHub Pages (public UI)` → `authenticated backend (future)` → `Supabase Auth + private JCE kernel`.

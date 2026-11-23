/**
 * Isolated PKCE callback; intentionally NOT deployed. Requires an explicitly
 * reviewed preview hostname and exact Supabase Auth redirect allowlist entry.
 * No JCE access, grants or browser-side membership queries.
 */
import { classifyCallback, sanitizeCallbackUrl } from './callback-core.mjs';
const status = document.getElementById('auth-status');
const detail = document.getElementById('auth-detail');
const response = classifyCallback(window.location.href);
history.replaceState(null, '', sanitizeCallbackUrl(window.location.href));

if (response.kind === 'error') {
  status.textContent = 'The authentication link could not be accepted.';
  detail.textContent = 'Request a new sign-in link after the preview callback is configured. The previous link cannot be reused.';
} else if (response.kind !== 'code') {
  status.textContent = 'No valid authentication response was received.';
  detail.textContent = 'Return to the approved sign-in page. Do not share authentication links.';
} else {
  status.textContent = 'Verifying identity…';
  detail.textContent = 'Authentication is not institutional authorization.';
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.0?bundle');
    const { authConfiguration } = await import('./config.mjs');
    if (!authConfiguration?.publishableKey || !authConfiguration?.url) throw Error('configuration_missing');
    const client = createClient(authConfiguration.url, authConfiguration.publishableKey, {
      auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: false, autoRefreshToken: false }
    });
    const { data, error } = await client.auth.exchangeCodeForSession(response.code);
    if (error || !data?.session?.access_token) throw Error('code_exchange_failed');
    const verified = await client.auth.getUser(data.session.access_token);
    if (verified.error || !verified.data?.user?.id) throw Error('identity_verification_failed');
    status.textContent = 'Identity verified for this session.';
    detail.textContent = 'No constitutional authority has been granted. This preview deliberately does not persist the session or provide access to the JCE.';
    await client.auth.signOut({ scope: 'local' });
  } catch {
    status.textContent = 'Identity verification is unavailable.';
    detail.textContent = 'The callback may be unconfigured, expired or already used. No institutional permissions were granted.';
  }
}

/**
 * Server-side identity verification against Supabase Auth.
 * Never use user-supplied actor IDs or decoded JWT payloads as identity.
 * The publishable key is not a privileged database credential.
 * Caller must still enforce session policy and current JCE membership.
 */
export function createSupabaseAuthVerifier({ projectUrl, publishableKey, fetchImpl = fetch }) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(projectUrl || '') || !publishableKey) {
    throw new Error('invalid_supabase_configuration');
  }
  return async function authenticateToken(token) {
    if (typeof token !== 'string' || !token || token.length > 8192) return null;
    const response = await fetchImpl(projectUrl + '/auth/v1/user', {
      method: 'GET',
      headers: { apikey: publishableKey, Authorization: 'Bearer ' + token, Accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return null;
    const user = await response.json();
    if (typeof user?.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(user.id)) return null;
    if (!user.email_confirmed_at) return null;
    return { id: user.id };
  };
}

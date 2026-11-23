export function classifyCallback(rawUrl) {
  const url = new URL(rawUrl);
  const fragment = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  const error = url.searchParams.get('error') || fragment.get('error');
  if (error) return { kind: 'error', code: 'auth_error' };
  const code = url.searchParams.get('code');
  if (code && !fragment.has('access_token') && !fragment.has('refresh_token')) return { kind: 'code', code };
  return { kind: 'missing' };
}
export function sanitizeCallbackUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.search = '';
  url.hash = '';
  return url.pathname;
}

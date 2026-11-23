// Copy to config.mjs only for an isolated, reviewed HTTPS preview.
// Never include a secret/service_role key. Publishable key is browser-safe.
// Exact preview URL must be approved in Supabase Auth Redirect URLs.
export const authConfiguration = {
  url: 'https://ezwxcvpcrnsqajixwkvq.supabase.co',
  publishableKey: ''
};

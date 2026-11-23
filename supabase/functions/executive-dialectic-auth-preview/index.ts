import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Source-of-truth template for the controlled founder Auth preview.
 * The deployed version receives the active browser-safe publishable key at deploy time.
 * No service-role key, JCE credential or constitutional operation is present here.
 */
const PROJECT_URL = "https://ezwxcvpcrnsqajixwkvq.supabase.co";
const CALLBACK_URL = PROJECT_URL + "/functions/v1/executive-dialectic-auth-preview";
const FOUNDER_EMAIL = "felipe.carval@proton.me";

function page(body: string) {
  return new Response(body, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"
    }
  });
}

Deno.serve((req: Request) => {
  const url = new URL(req.url);
  if (url.searchParams.has("error")) {
    return page("<h1>Authentication not accepted</h1><p>No institutional authority was granted.</p>");
  }
  if (url.searchParams.has("code")) {
    return page("<h1>Identity callback received</h1><p>The one-time authorization code reached the isolated HTTPS endpoint. This does not grant JCE access.</p>");
  }
  return page(`<h1>Executive Dialectic™ · controlled identity preview</h1>
<p>Founder: ${FOUNDER_EMAIL}</p>
<p>Callback: ${CALLBACK_URL}</p>
<p>This endpoint has no JCE credentials and confers no institutional authority.</p>`);
});

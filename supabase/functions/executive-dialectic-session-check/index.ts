import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Production-shaped session verifier. Deployed with verify_jwt=true.
 * The live deployment receives the active browser-safe publishable key at deploy time.
 * It returns only verified identity/session assurance data; no JCE access.
 */
const PROJECT_URL="https://ezwxcvpcrnsqajixwkvq.supabase.co";

function json(body: unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{
    "content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"
  }});
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="GET") return json({ok:false,code:"method_not_allowed"},405);
  const auth=req.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer ")) return json({ok:false,code:"missing_bearer"},401);
  return json({ok:false,code:"template_requires_deploy_time_publishable_key"},503);
});

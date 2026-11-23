import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseAuthVerifier } from '../src/security/supabase-auth-verifier.mjs';
const url='https://ezwxcvpcrnsqajixwkvq.supabase.co';
const id='471d6599-16ac-40dd-bca5-06bcd52fec28';
test('verified server response establishes actor UUID', async () => {
  let seen;
  const verifier=createSupabaseAuthVerifier({projectUrl:url,publishableKey:'public-test-key',fetchImpl:async (target,opts)=>{seen={target,opts};return {ok:true,json:async()=>({id,email_confirmed_at:'2026-11-23T00:00:00Z'})}}});
  assert.deepEqual(await verifier('valid-test-token'),{id});
  assert.equal(seen.target,url+'/auth/v1/user');
  assert.equal(seen.opts.headers.Authorization,'Bearer valid-test-token');
});
test('invalid bearer rejected',async()=>{
  const verifier=createSupabaseAuthVerifier({projectUrl:url,publishableKey:'key',fetchImpl:async()=>({ok:false})});
  assert.equal(await verifier('bad'),null);
});
test('unconfirmed email rejected',async()=>{
  const verifier=createSupabaseAuthVerifier({projectUrl:url,publishableKey:'key',fetchImpl:async()=>({ok:true,json:async()=>({id})})});
  assert.equal(await verifier('token'),null);
});
test('forged user metadata ignored',async()=>{
  const verifier=createSupabaseAuthVerifier({projectUrl:url,publishableKey:'key',fetchImpl:async()=>({ok:true,json:async()=>({id,email_confirmed_at:'now',user_metadata:{role:'ADMIN',id:'mallory'}})})});
  assert.deepEqual(await verifier('token'),{id});
});
test('untrusted endpoint rejected',()=>assert.throws(()=>createSupabaseAuthVerifier({projectUrl:'https://attacker.example',publishableKey:'key'})));

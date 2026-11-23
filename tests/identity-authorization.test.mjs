import test from 'node:test';
import assert from 'node:assert/strict';
import { authorize } from '../src/security/authorization.mjs';
import { evaluateRequest, verifyRequest } from '../src/security/identity-adapter.mjs';

const membership = (user_id, organization_id, role='EDITOR', active=true) =>
  ({ user_id, organization_id, role, active });
const authenticateToken = async token => token === 'valid-token' ? { id: 'alice' } : null;
const lookupMemberships = async () => [membership('alice','org-a')];
const evaluate = overrides => evaluateRequest({
  authorizationHeader: 'Bearer valid-token', organizationId: 'org-a',
  action: 'read', authenticateToken, lookupMemberships, ...overrides
});

test('missing bearer fails closed', async () => {
  assert.equal((await verifyRequest({ authorizationHeader:'', authenticateToken })).status,401);
});
test('unverified token fails closed', async () => {
  assert.equal((await evaluate({ authorizationHeader:'Bearer invalid-token' })).status,401);
});
test('trusted identity comes from verifier, not client actor', async () => {
  const result = await evaluate({ actorId:'mallory' });
  assert.equal(result.actorId,'alice');
});
test('org A cannot access org B', async () => {
  const result = await evaluate({ organizationId:'org-b' });
  assert.equal(result.status,403);
});
test('unaffiliated user denied', () => {
  assert.equal(authorize({ actorId:'mallory', organizationId:'org-a', action:'read', memberships:[membership('alice','org-a')] }).allowed,false);
});
test('inactive membership denied', () => {
  assert.equal(authorize({ actorId:'alice', organizationId:'org-a', action:'read', memberships:[membership('alice','org-a','ADMIN',false)] }).allowed,false);
});
test('editor cannot authorize final judgment', () => {
  assert.equal(authorize({ actorId:'alice', organizationId:'org-a', action:'authorize_final', memberships:[membership('alice','org-a')] }).allowed,false);
});
test('reviewer can verify but cannot authorize final', () => {
  const args={actorId:'alice',organizationId:'org-a',memberships:[membership('alice','org-a','REVIEWER')]};
  assert.equal(authorize({...args,action:'verify_human'}).allowed,true);
  assert.equal(authorize({...args,action:'authorize_final'}).allowed,false);
});
test('authorizer can authorize final', () => {
  assert.equal(authorize({actorId:'alice',organizationId:'org-a',action:'authorize_final',memberships:[membership('alice','org-a','AUTHORIZER')]}).allowed,true);
});
test('unrecognized action denied', () => {
  assert.equal(authorize({actorId:'alice',organizationId:'org-a',action:'delete_history',memberships:[membership('alice','org-a','ADMIN')]}).allowed,false);
});
test('database failure fails closed', async () => {
  assert.equal((await evaluate({lookupMemberships:async()=>{throw Error('down')}})).status,503);
});
test('user-editable metadata cannot override membership', async () => {
  const result=await evaluate({authenticateToken:async()=>({id:'alice',user_metadata:{role:'ADMIN'}}),action:'authorize_final'});
  assert.equal(result.status,403);
});

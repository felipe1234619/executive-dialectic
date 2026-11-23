/**
 * Server-side adapter core. Injection keeps tests independent of credentials.
 * authenticateToken MUST use a trusted Auth verification endpoint, not decode().
 * lookupMemberships MUST read current database state, not stale JWT claims.
 *
 * This is NOT an operational JCE gateway. No DB writes are implemented.
 */
import { authorize } from './authorization.mjs';

export async function verifyRequest({ authorizationHeader, authenticateToken }) {
  const match = /^Bearer ([A-Za-z0-9._~+/-]+={0,2})$/.exec(authorizationHeader || '');
  if (!match) return { ok: false, status: 401, code: 'missing_or_invalid_bearer' };
  try {
    const user = await authenticateToken(match[1]);
    if (!user || typeof user.id !== 'string' || !user.id) {
      return { ok: false, status: 401, code: 'invalid_identity' };
    }
    return { ok: true, actorId: user.id };
  } catch {
    return { ok: false, status: 401, code: 'identity_verification_failed' };
  }
}

export async function evaluateRequest({ authorizationHeader, organizationId, action, authenticateToken, lookupMemberships }) {
  const identity = await verifyRequest({ authorizationHeader, authenticateToken });
  if (!identity.ok) return identity;
  if (typeof organizationId !== 'string' || !organizationId) {
    return { ok: false, status: 400, code: 'organization_required' };
  }
  try {
    const memberships = await lookupMemberships(identity.actorId, organizationId);
    const decision = authorize({ actorId: identity.actorId, organizationId, action, memberships });
    return decision.allowed
      ? { ok: true, actorId: identity.actorId, organizationId, role: decision.role }
      : { ok: false, status: 403, code: decision.reason };
  } catch {
    return { ok: false, status: 503, code: 'authorization_unavailable' };
  }
}

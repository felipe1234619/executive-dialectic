/**
 * Pure authorization decision point. The caller MUST supply a user ID obtained
 * from verified Supabase Auth, and membership rows fetched by a trusted backend.
 * This module never trusts client-supplied actor IDs or roles.
 */
export const ROLES = Object.freeze(['EDITOR', 'REVIEWER', 'AUTHORIZER', 'ADMIN']);
const READ_ROLES = new Set(ROLES);
const APPEND_ROLES = new Set(ROLES);
const REVIEW_ROLES = new Set(['REVIEWER', 'AUTHORIZER', 'ADMIN']);
const FINAL_ROLES = new Set(['AUTHORIZER', 'ADMIN']);

export function authorize({ actorId, organizationId, action, memberships }) {
  if (typeof actorId !== 'string' || !actorId || typeof organizationId !== 'string' || !organizationId) {
    return { allowed: false, reason: 'identity_or_scope_missing' };
  }
  if (!Array.isArray(memberships)) return { allowed: false, reason: 'membership_unavailable' };
  const membership = memberships.find(m =>
    m.user_id === actorId && m.organization_id === organizationId &&
    m.active === true && ROLES.includes(m.role)
  );
  if (!membership) return { allowed: false, reason: 'membership_required' };
  const roles = action === 'read' ? READ_ROLES :
    action === 'append_proposal' ? APPEND_ROLES :
    action === 'verify_human' ? REVIEW_ROLES :
    action === 'authorize_final' ? FINAL_ROLES : null;
  if (!roles || !roles.has(membership.role)) return { allowed: false, reason: 'insufficient_authority' };
  return { allowed: true, role: membership.role };
}

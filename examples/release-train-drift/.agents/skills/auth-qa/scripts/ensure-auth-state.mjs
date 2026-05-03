export function ensureAuthState() {
  return { status: 'ready', roles: ['owner', 'member', 'invitee'] };
}

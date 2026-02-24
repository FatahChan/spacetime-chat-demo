function getOrigin() {
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:5173';
}

const clientId = import.meta.env.VITE_SPACETIMEDB_AUTH_CLIENT_ID;
if (import.meta.env.DEV && !clientId) {
  console.warn(
    '[Auth] VITE_SPACETIMEDB_AUTH_CLIENT_ID is not set. Add it to .env.local (see docs/PHASE1_SPACETIMEAUTH_SETUP.md)'
  );
}

export const oidcConfig = {
  authority: 'https://auth.spacetimedb.com/oidc',
  client_id: clientId ?? 'client_placeholder',
  redirect_uri: `${getOrigin()}/callback`,
  post_logout_redirect_uri: getOrigin(),
  scope: 'openid profile email',
  response_type: 'code' as const,
  automaticSilentRenew: true,
};

export function onSigninCallback() {
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

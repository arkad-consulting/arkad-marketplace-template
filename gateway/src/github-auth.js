/**
 * Default handler: GitHub OAuth login + GitHub org allowlist,
 * plus a public health endpoint.
 *
 * Only active members of ALLOWED_ORG (a plain var in wrangler.toml) can
 * complete authorization. Team members need a GitHub account in the org —
 * no Cloudflare account required.
 */

import { ALL_TOOLS } from './mcp.js';

const GH_HEADERS = (token) => ({
  Authorization: `Bearer ${token}`,
  'User-Agent': 'arkad-mcp-gateway',
  Accept: 'application/vnd.github+json',
});

export const gitHubAuthHandler = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const org = env.ALLOWED_ORG;

    // Public health check. It reports the tool inventory by family — names and
    // counts only, no descriptions — because the recurring question is not "is
    // the Worker up" but "does the gateway actually serve the tool my session
    // cannot see". A client holding a cached tool list is otherwise
    // indistinguishable from a gateway that never shipped it.
    if (url.pathname === '/' && request.method === 'GET') {
      const families = {};
      for (const t of ALL_TOOLS) {
        const family = t.name.split('_')[0];
        families[family] = (families[family] || 0) + 1;
      }
      return Response.json({
        status: 'ok',
        service: 'Arkad MCP Gateway',
        auth: `GitHub OAuth · org:${org}`,
        tools: ALL_TOOLS.length,
        families,
        note: 'If your session lists fewer tools than this, it is holding a cached tool list — reconnect the connector (Settings -> Connectors -> disconnect, then connect). Opening a new chat is not enough: the cache lives on the connector.',
      });
    }

    // Refuse to authorize anyone if the allowlist is not configured.
    if (!org) return new Response('Gateway misconfigured: ALLOWED_ORG is not set', { status: 500 });

    // Step 1 — MCP client hits /authorize; bounce to GitHub login
    if (url.pathname === '/authorize') {
      const oauthReqInfo = await env.OAUTH_PROVIDER.parseAuthRequest(request);
      const gh = new URL('https://github.com/login/oauth/authorize');
      gh.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      gh.searchParams.set('redirect_uri', `${url.origin}/callback`);
      gh.searchParams.set('scope', 'read:org user:email');
      gh.searchParams.set('state', btoa(JSON.stringify(oauthReqInfo)));
      return Response.redirect(gh.toString(), 302);
    }

    // Step 2 — GitHub redirects back; verify identity + org membership
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      if (!code || !state) return new Response('Missing code/state', { status: 400 });

      let oauthReqInfo;
      try {
        oauthReqInfo = JSON.parse(atob(state));
      } catch {
        return new Response('Bad state', { status: 400 });
      }

      // Exchange the code for a GitHub access token
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }).toString(),
      });
      const { access_token: accessToken } = await tokenRes.json();
      if (!accessToken) return new Response('GitHub token exchange failed', { status: 401 });

      // Who is it?
      const userRes = await fetch('https://api.github.com/user', { headers: GH_HEADERS(accessToken) });
      if (!userRes.ok) return new Response('GitHub user lookup failed', { status: 401 });
      const user = await userRes.json();

      // Is it an active member of the org? (self-membership endpoint)
      const memRes = await fetch(
        `https://api.github.com/user/memberships/orgs/${org}`,
        { headers: GH_HEADERS(accessToken) },
      );
      const membership = memRes.ok ? await memRes.json() : null;
      if (!membership || membership.state !== 'active') {
        return new Response(
          `Access denied: ${user.login} is not an active member of ${org}.`,
          { status: 403 },
        );
      }

      // Hand control back to the OAuthProvider — it mints the token for the MCP client
      const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
        request: oauthReqInfo,
        userId: String(user.id),
        scope: oauthReqInfo.scope,
        metadata: { label: user.login },
        props: { githubId: user.id, username: user.login, email: user.email },
      });

      // Loopback redirect targets (local Claude Code listener) dead-end in the
      // browser when the MCP client is actually remote (claude.ai / Cowork
      // sandbox): serve a self-redirecting page with recovery guidance instead
      // of a blind 302. Non-loopback targets (e.g. the claude.ai connector
      // callback) keep the plain redirect.
      const targetHost = new URL(redirectTo).hostname;
      if (targetHost !== 'localhost' && targetHost !== '127.0.0.1') {
        return Response.redirect(redirectTo, 302);
      }
      return new Response(loopbackRedirectPage(redirectTo), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};

/**
 * Post-authorization page for loopback redirect URIs. Tries the redirect
 * immediately (local Claude Code completes as before); if nothing is listening
 * the user stays here and gets told to connect via Claude's Connectors
 * settings instead of the chat-generated link.
 */
function loopbackRedirectPage(redirectTo) {
  const href = redirectTo
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Arkad MCP Gateway — authorized</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         background: #15171a; color: #eef0f2; font: 16px/1.6 system-ui, sans-serif; }
  main { max-width: 34rem; padding: 2.5rem 1.5rem; }
  h1 { font-size: 1.3rem; margin: 0 0 .5rem; }
  h1 span, a, .fallback strong { color: #6fb3ff; }
  .fallback { margin-top: 2rem; padding: 1rem 1.25rem; border: 1px solid #33373d; border-radius: 8px; }
  small { color: #8b9097; }
</style>
</head>
<body>
<main>
  <h1><span>✓</span> Authorization complete</h1>
  <p>Returning you to Claude… If nothing happens, <a href="${href}">continue manually</a>.</p>
  <div class="fallback">
    <p><strong>Page not loading after the redirect?</strong> You are probably connecting
    from claude.ai or Cowork — this browser cannot reach that Claude session, and
    pasting this page's URL back into the chat will not work either.</p>
    <p>Close this tab, go back to Claude, and connect the <strong>Arkad Gateway</strong>
    from <strong>Settings&nbsp;→&nbsp;Connectors</strong> instead of using a chat link.</p>
  </div>
  <p><small>Arkad MCP Gateway</small></p>
</main>
<script>location.replace(${JSON.stringify(redirectTo)});</script>
</body>
</html>`;
}

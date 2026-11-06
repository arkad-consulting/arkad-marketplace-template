/**
 * The org gate: only an ACTIVE member of ALLOWED_ORG gets a token.
 * Drives gitHubAuthHandler with a stubbed GitHub API and a fake OAuthProvider.
 *
 * Run: npm test
 */
import { gitHubAuthHandler } from '../src/github-auth.js';

let fail = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);
  if (!cond) fail++;
};

let completed = null;
const env = {
  ALLOWED_ORG: 'arkad-consulting',
  GITHUB_CLIENT_ID: 'id',
  GITHUB_CLIENT_SECRET: 'secret',
  OAUTH_PROVIDER: {
    parseAuthRequest: async () => ({ clientId: 'claude', scope: ['mcp'] }),
    completeAuthorization: async (args) => {
      completed = args;
      return { redirectTo: 'https://claude.example/callback?code=abc' };
    },
  },
};

/** GitHub as seen by the gateway, with the membership state under test. */
const github = (membershipState) => {
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith('/login/oauth/access_token')) return Response.json({ access_token: 'gh-token' });
    if (u.endsWith('/user')) return Response.json({ id: 42, login: 'ada-example', email: 'ada@example.com' });
    if (u.includes('/user/memberships/orgs/arkad-consulting')) {
      return membershipState ? Response.json({ state: membershipState }) : new Response('', { status: 404 });
    }
    return new Response('unexpected ' + u, { status: 500 });
  };
};

const state = btoa(JSON.stringify({ clientId: 'claude', scope: ['mcp'] }));
const callback = () =>
  gitHubAuthHandler.fetch(new Request(`https://gw.test/callback?code=c&state=${state}`), env, {});

// health
const health = await (await gitHubAuthHandler.fetch(new Request('https://gw.test/'), env, {})).json();
check('health lists the tool families', health.status === 'ok' && health.families.team === 1, JSON.stringify(health.families));

// authorize bounces to GitHub
const authz = await gitHubAuthHandler.fetch(new Request('https://gw.test/authorize'), env, {});
check('/authorize redirects to GitHub with read:org',
  authz.status === 302 && /github\.com\/login\/oauth\/authorize.*read%3Aorg/.test(authz.headers.get('Location')));

// not a member / pending invite
for (const s of [null, 'pending']) {
  completed = null;
  github(s);
  const r = await callback();
  check(`membership ${s ?? 'missing'} is refused`, r.status === 403 && completed === null);
}

// active member
completed = null;
github('active');
const ok = await callback();
check('an active member is authorized', ok.status === 302 && completed?.props?.username === 'ada-example');

// misconfigured gateway refuses everyone
const noOrg = await gitHubAuthHandler.fetch(new Request(`https://gw.test/callback?code=c&state=${state}`), { ...env, ALLOWED_ORG: '' }, {});
check('no ALLOWED_ORG means nobody gets in', noOrg.status === 500);

console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed');
process.exit(fail ? 1 : 0);

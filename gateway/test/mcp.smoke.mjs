/**
 * Local smoke test of the gateway MCP handler — no Cloudflare, no OAuth, no
 * network. Drives `mcpApiHandler` directly with a stubbed `fetch`, so a broken
 * path, a missing header or a mis-mapped error is caught before deploy rather
 * than by a user.
 *
 * Run: npm test
 */
import { mcpApiHandler, ALL_TOOLS } from '../src/mcp.js';

const env = { CRM_API_URL: 'https://crm.test/api/', CRM_API_KEY: 'SECRET-KEY' };
const listed = { props: { username: 'Ada-Example', githubId: 1 } };

const call = async (body, ctx = listed, e = env) => {
  const req = new Request('https://gw.test/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await mcpApiHandler.fetch(req, e, ctx)).json();
};
const tool = (name, args = {}, ctx, e) =>
  call({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }, ctx, e);
const text = (r) => r.result?.content?.[0]?.text ?? '';

let fail = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);
  if (!cond) fail++;
};

/** Records every outbound request and answers from a route table. */
let calls = [];
const stubFetch = (route) => {
  calls = [];
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), opts });
    return route(String(url), opts);
  };
};

// --- protocol -------------------------------------------------------------
const init = await call({ jsonrpc: '2.0', id: 1, method: 'initialize' });
check('initialize answers with the server name', init.result?.serverInfo?.name === 'arkad-mcp-gateway');

const list = await call({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
check('tools/list returns every registered tool', list.result?.tools?.length === ALL_TOOLS.length);
check('every tool has a name, description and object schema',
  ALL_TOOLS.every((t) => t.name && t.description && t.inputSchema?.type === 'object'));
check('every tool name starts with its family prefix', ALL_TOOLS.every((t) => /^[a-z]+_[a-z_]+$/.test(t.name)));

const unknown = await tool('nope_tool');
check('an unknown tool is a JSON-RPC error', unknown.error?.code === -32601);

// --- team_* ---------------------------------------------------------------
const me = await tool('team_whoami');
check('team_whoami resolves a listed login, case-insensitively', JSON.parse(text(me)).email === 'ada@example.com');

const stranger = await tool('team_whoami', {}, { props: { username: 'someone-else', githubId: 9 } });
check('team_whoami refuses an unlisted login', stranger.result?.isError && /not in the team list/.test(text(stranger)));

// --- sitecheck_* ----------------------------------------------------------
for (const bad of ['http://localhost:8787', 'http://127.0.0.1', 'https://[::1]/', 'ftp://example.com', 'not a url']) {
  const r = await tool('sitecheck_status', { url: bad });
  check(`sitecheck_status refuses ${bad}`, r.result?.isError === true, text(r));
}

stubFetch(() => new Response('ok', {
  status: 200,
  headers: { 'strict-transport-security': 'max-age=63072000', 'x-content-type-options': 'nosniff' },
}));
const site = JSON.parse(text(await tool('sitecheck_status', { url: 'https://example.com' })));
check('sitecheck_status reports status and present headers',
  site.status === 200 && site.security_headers.present.includes('strict-transport-security'));
check('sitecheck_status reports missing headers', site.security_headers.missing.includes('content-security-policy'));

// --- crm_* ----------------------------------------------------------------
const unconfigured = await tool('crm_search_contacts', { query: 'x' }, listed, {});
check('crm_* says clearly when the CRM is not configured', /not configured/.test(text(unconfigured)));

stubFetch(() => Response.json([{ id: 'c1', name: 'Jane Doe' }]));
const found = await tool('crm_search_contacts', { query: 'jane & co', limit: 500 });
check('crm_search_contacts calls the CRM with the server-side key',
  calls[0]?.opts.headers.Authorization === 'Bearer SECRET-KEY');
check('crm_search_contacts encodes the query and caps the limit',
  calls[0]?.url === 'https://crm.test/api/contacts?q=jane%20%26%20co&limit=50', calls[0]?.url);
check('the CRM key never reaches the client', !JSON.stringify(found).includes('SECRET-KEY'));

stubFetch(() => new Response('boom', { status: 502 }));
const upstream = await tool('crm_get_contact', { id: 'c1' });
check('an upstream error comes back as a tool error, not a crash',
  upstream.result?.isError && /502/.test(text(upstream)));

console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed');
process.exit(fail ? 1 : 0);

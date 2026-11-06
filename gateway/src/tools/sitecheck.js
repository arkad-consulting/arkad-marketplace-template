/**
 * sitecheck_* — a tool with no secret at all (spec 0001).
 * Example family: replace it with your own tools and keep the shape.
 *
 * It fetches a public URL once and reports what a quick health check needs.
 * Read-only and keyless, so it is the example to copy for tools that only
 * need the gateway for auth and reach, not for a credential.
 */

export const sitecheckTools = [
  {
    name: 'sitecheck_status',
    description: 'Fetch a public URL once and report its HTTP status, response time, final URL after redirects, and which common security headers are present or missing. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full public URL, e.g. https://example.com' },
      },
      required: ['url'],
    },
  },
];

const SECURITY_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
];

/** A public http(s) URL, or a refusal: no localhost, no IP literals. */
function publicUrl(raw) {
  let u;
  try {
    u = new URL(String(raw ?? ''));
  } catch {
    throw new Error(`Not a URL: ${raw}`);
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('Only http(s) URLs are checked');
  const host = u.hostname;
  if (host === 'localhost' || host.endsWith('.localhost') || /^[\d.]+$/.test(host) || host.includes(':') || host.startsWith('[')) {
    throw new Error('Give a public host name, not localhost or an IP address');
  }
  return u;
}

export async function sitecheckExecute(name, args) {
  if (name === 'sitecheck_status') {
    const url = publicUrl(args.url);
    const started = Date.now();
    const res = await fetch(url.href, {
      redirect: 'follow',
      headers: { 'User-Agent': 'arkad-mcp-gateway/sitecheck' },
    });
    const ms = Date.now() - started;
    const present = SECURITY_HEADERS.filter((h) => res.headers.has(h));
    return {
      url: url.href,
      final_url: res.url || url.href,
      status: res.status,
      redirected: res.redirected,
      response_ms: ms,
      security_headers: {
        present,
        missing: SECURITY_HEADERS.filter((h) => !present.includes(h)),
      },
    };
  }
  throw new Error(`Unknown tool: ${name}`);
}

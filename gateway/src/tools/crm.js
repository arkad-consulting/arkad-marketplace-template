/**
 * crm_* — the pattern for any tool backed by a third-party API.
 * Example family: point it at your own API, or replace it and keep the shape.
 *
 * The API key is a Worker secret (CRM_API_KEY): it never leaves the gateway,
 * and the client only ever holds its OAuth token. Point CRM_API_URL at your
 * CRM; the two paths below stand in for its search and read endpoints —
 * adapt them, keep the shape.
 */

export const crmTools = [
  {
    name: 'crm_search_contacts',
    description: 'Search CRM contacts by name, e-mail or company. Returns at most `limit` matches with their id, name, company and e-mail.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Name, e-mail or company to search for' },
        limit: { type: 'integer', description: 'Max results, 1-50 (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'crm_get_contact',
    description: 'Read one CRM contact by id (from crm_search_contacts), with its company and last activity.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Contact id' },
      },
      required: ['id'],
    },
  },
];

async function crm(env, path) {
  if (!env.CRM_API_URL || !env.CRM_API_KEY) {
    throw new Error('The CRM is not configured on this gateway (secrets CRM_API_URL and CRM_API_KEY)');
  }
  const res = await fetch(`${env.CRM_API_URL.replace(/\/$/, '')}${path}`, {
    headers: { Authorization: `Bearer ${env.CRM_API_KEY}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`CRM answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export async function crmExecute(name, args, env) {
  if (name === 'crm_search_contacts') {
    if (!args.query) throw new Error('query is required');
    const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50);
    return crm(env, `/contacts?q=${encodeURIComponent(args.query)}&limit=${limit}`);
  }
  if (name === 'crm_get_contact') {
    if (!args.id) throw new Error('id is required');
    return crm(env, `/contacts/${encodeURIComponent(args.id)}`);
  }
  throw new Error(`Unknown tool: ${name}`);
}

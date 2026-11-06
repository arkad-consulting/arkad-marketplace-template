/**
 * Vanilla MCP handler (JSON-RPC 2.0, protocol 2024-11-05).
 * Runs behind the OAuthProvider: requests reaching here are already
 * authenticated. The authenticated user is available on `ctx.props`.
 *
 * Adding a tool family: create src/tools/<family>.js exporting
 * `<family>Tools` (definitions) and `<family>Execute` (implementation), then
 * register it in the two places below. Every tool name starts with
 * `<family>_` — the router and scripts/check-drift.sh both rely on it.
 */

import { teamTools, teamExecute } from './tools/team.js';
import { sitecheckTools, sitecheckExecute } from './tools/sitecheck.js';
import { crmTools, crmExecute } from './tools/crm.js';

export const ALL_TOOLS = [...teamTools, ...sitecheckTools, ...crmTools];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
const rpc = (result, id) => ({ jsonrpc: '2.0', result, id });
const rpcErr = (code, message, id) => ({ jsonrpc: '2.0', error: { code, message }, id });

async function executeTool(name, args, env, user) {
  if (name.startsWith('team_')) return teamExecute(name, args, env, user);
  if (name.startsWith('sitecheck_')) return sitecheckExecute(name, args, env);
  if (name.startsWith('crm_')) return crmExecute(name, args, env);
  throw new Error(`Unknown tool: ${name}`);
}

export const mcpApiHandler = {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json(rpcErr(-32700, 'Parse error', null));
    }

    const { method, params, id } = body;

    switch (method) {
      case 'initialize':
        return json(rpc({
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'arkad-mcp-gateway', version: '1.0.0' },
        }, id));

      case 'notifications/initialized':
        return json(rpc({}, id));

      case 'ping':
        return json(rpc({}, id));

      case 'tools/list':
        return json(rpc({ tools: ALL_TOOLS }, id));

      case 'tools/call': {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        if (!toolName) return json(rpcErr(-32602, 'Missing tool name', id));
        if (!ALL_TOOLS.find(t => t.name === toolName)) {
          return json(rpcErr(-32601, `Unknown tool: ${toolName}`, id));
        }
        try {
          const result = await executeTool(toolName, toolArgs, env, ctx?.props);
          // A tool may return a ready-made MCP result; pass it through.
          if (result && Array.isArray(result.content)) {
            return json(rpc(result, id));
          }
          return json(rpc({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }, id));
        } catch (err) {
          return json(rpc({ content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true }, id));
        }
      }

      default:
        return json(rpcErr(-32601, `Method not found: ${method}`, id));
    }
  },
};

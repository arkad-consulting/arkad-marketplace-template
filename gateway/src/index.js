/**
 * Arkad MCP Gateway
 * One OAuth-protected Cloudflare Worker exposing all Arkad tools to Claude.
 *
 * Auth:  GitHub OAuth, restricted to active members of one GitHub org (ALLOWED_ORG).
 * Store: all downstream API keys live as Worker secrets (never sent to clients).
 *
 * The OAuthProvider wraps a vanilla JSON-RPC MCP handler — no agents SDK.
 */

import { OAuthProvider } from '@cloudflare/workers-oauth-provider';
import { mcpApiHandler } from './mcp.js';
import { gitHubAuthHandler } from './github-auth.js';

export default new OAuthProvider({
  apiRoute: '/mcp',
  apiHandler: mcpApiHandler,
  defaultHandler: gitHubAuthHandler,
  authorizeEndpoint: '/authorize',
  tokenEndpoint: '/token',
  clientRegistrationEndpoint: '/register',
});

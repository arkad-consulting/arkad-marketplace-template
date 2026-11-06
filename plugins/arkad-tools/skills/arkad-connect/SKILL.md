---
name: arkad-connect
description: ALWAYS use this skill when the user says "connect the Arkad gateway", "sign in to the Arkad tools", "the Arkad tools do not work", "I get a 401", "access denied", "which tools do I have", or "check my connection". Explains how to sign in to the arkad-gateway connector on each Claude surface, checks the connection with team_whoami, and maps each sign-in error to its cause.
---

# Arkad gateway — sign in and check the connection

The `arkad-gateway` connector is an OAuth-protected MCP server. Sign-in is a
**GitHub login**; only active members of the gateway's GitHub org are let in.
There is no API key and nothing to paste.

## Sign in

- **Claude Code** (CLI on your machine) — run `/mcp` → *Authenticate*, or just call
  a tool; the browser flow completes on its own.
- **claude.ai / Claude Desktop / Cowork** — **Settings → Connectors** →
  *arkad-gateway* → **Connect**. Never use an authorization link generated inside
  the chat: it carries a `localhost` callback that only works for local Claude Code.

## Check

Call `team_whoami`. It answers with the GitHub login the gateway sees and your entry
in the team list. That one call proves the connector, the OAuth grant and the team
list are all in order.

## When it fails

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Access denied: <login> is not an active member of <org>` | not in the org, or the invitation is still pending | accept the invitation, reconnect |
| login completes, tools stay unauthenticated | a chat-generated link was used from a remote session | reconnect from **Settings → Connectors** |
| a tool returns 401 | the grant expired | reconnect |
| `not in the team list` | in the org but not in `gateway/src/people.js` | ask the gateway owner to add you |
| the session shows fewer tools than the gateway | the connector cached an old tool list | disconnect and reconnect; a new chat is not enough |

The gateway's public health page (`GET /` on the Worker) lists every tool family it
serves, to compare with what the session shows.

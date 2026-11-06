# ADR 0001: One OAuth-protected MCP gateway for every tool

## Status

Accepted.

## Context

Claude reaches our tools from three surfaces: Claude Code on a laptop, Cowork chat,
and scheduled tasks that run in an isolated sandbox. Credentials kept on the machine
(shell exports, `.env` files, keys pasted into a skill) reach only the first. The
sandbox sees none of them. Each new tool also tended to bring its own way of holding
its key.

The one layer present on all three surfaces is the Claude account's connector layer:
an OAuth grant made once is valid everywhere.

## Decision

- All tools are served by **one** remote MCP server, a Cloudflare Worker in `gateway/`.
- Sign-in is GitHub OAuth; access is **active membership of one GitHub org**.
- Every downstream key is a **Worker secret**. A client only ever holds its OAuth token.
- One plugin (`arkad-tools`) registers the connector and carries the skills. Not one
  plugin per tool.

Rejected:
- Skills that call APIs with `curl` — cheaper in context, but they need the key in a
  shell, which the sandbox does not have.
- One MCP server per tool — one sign-in and one secret store per tool, for no gain.

## Consequences

- Adding a team member is adding them to the GitHub org. They need no Cloudflare account.
- Tool definitions load eagerly into context while the connector is on (a few thousand
  tokens). Keep descriptions lean; expose only tools that are used.
- The gateway is a single point of failure. Its health page lists the tool families it
  serves so an outage and a stale client cache can be told apart.

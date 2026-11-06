# Security model

## What is protected, and by what

| Asset | Protection |
| --- | --- |
| Downstream API keys | Worker secrets. Never in git, never in a plugin, never returned by a tool. The smoke test checks that a key does not reach the client. |
| Access to the tools | GitHub OAuth + **active** membership of `ALLOWED_ORG`. A pending invitation is refused. No `ALLOWED_ORG` → nobody gets in. |
| Acting as a person | Tools that act as someone resolve the caller from the OAuth identity (`people.js`). They never accept a user id as an argument (ADR 0003). |
| The plugins | Public text and assets. They hold the gateway URL, nothing else. |

## Rules for new tools

1. A credential is a Worker secret, named in `.env.example` and `environments.md`.
2. Read-only first. A tool that writes or sends says so in its description, and the
   skill that drives it asks the user to confirm before calling it.
3. A tool that fetches a URL refuses `localhost` and IP literals (see `sitecheck.js`).
4. Upstream errors come back as tool errors with a short, non-secret message — never
   the upstream response headers.
5. Every new tool family gets checks in `gateway/test/mcp.smoke.mjs`.

## Supply chain

Exact versions in `package.json`, lockfile committed, `npm ci` only, install scripts
disabled (`gateway/.npmrc`). A new dependency is picked at a version published at
least two weeks earlier. GitHub Actions are pinned by commit SHA.

## Reporting

See `SECURITY.md` at the repository root.

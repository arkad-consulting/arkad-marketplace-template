# Architecture — why a marketplace plus a gateway

## The problem

A team wants Claude to use its internal tools — a CRM, a time tracker, a site
scanner, a PDF service — and to follow its house rules: the brand voice, the
document layout, the way a project is set up. Claude has to do that from **three
different surfaces**:

1. **Claude Code** — the CLI on a laptop
2. **Cowork chat** — desktop or web
3. **Scheduled tasks** — which run in a **separate, isolated sandbox**

Two things make that messy.

**Credentials end up everywhere.** Without a plan, each tool brings its own way of
holding its key: an export in `~/.zshrc`, a `.env` file, a key pasted into a skill,
a bearer token inline in a connector config. Same concept, four places, and every
new team member has to collect them all.

**Machine-local credentials cannot reach the sandbox.**

| Surface | Sees the machine's env and files? |
| --- | --- |
| Claude Code | ✅ inherits the shell |
| Cowork chat | ⚠️ partially; remote connectors never use the shell env |
| Scheduled sandbox | ❌ isolated: no access to the laptop at all |

So any "put the key in an env var" strategy works on one surface out of three.

The one layer present on **all three** is the Claude account's **connector / OAuth
layer**: a grant made once lives in the account, and the sandbox inherits the
account's connectors, not the laptop's files.

## The solution

**One OAuth-protected MCP gateway** — a Cloudflare Worker — exposes all tools
behind a single endpoint, and **one marketplace** distributes the skills that
teach Claude to use them.

```
┌──────────────── CLAUDE SURFACES ─────────────────┐
│  Claude Code    Cowork chat    Scheduled sandbox │
└───────┬─────────────┬───────────────┬────────────┘
        └─────────────┴───────────────┘
                      │ one OAuth login (GitHub, org membership)
                      │ grant stored in the Claude account → valid everywhere
                      ▼
      ┌────────────────────────────────────────────┐
      │              Arkad MCP Gateway              │
      │  OAuth          → who gets in (GitHub org)  │
      │  people.js      → who each caller is        │
      │  Worker secrets → THE key store             │
      │  tools          → team_*  sitecheck_* crm_* │
      └──────┬────────────────┬──────────────┬──────┘
           CRM API      public web      your services…
```

Three properties do the work:

1. **Auth lives in the account layer** → every surface, sandbox included. Nothing
   to copy to a machine.
2. **Every downstream key is a Worker secret** — one store, server-side, never sent
   to a client. The client holds only an OAuth token.
3. **The allowlist is GitHub org membership.** Add someone to the org and they are
   in. They need a GitHub account, not a Cloudflare one; only the gateway owner
   deploys.

## Tools, skills, rules — three layers

MCP tools and skills load differently:

- **MCP tools are eager**: every tool's name, description and input schema enters
  the context when the connector is on. A few thousand tokens for a dozen tools.
- **Skills are lazy**: only the name and one-line description load upfront; the
  body loads when the skill is used. Near-zero cost at rest.

Why not implement tools as skills that run `curl`, which is cheaper? Because a
skill running `curl` needs the credential in the shell — which the sandbox does not
have. That is the problem we started from. So the pattern is a hybrid:

| Layer | Lives in | Role | Context cost | Works in the sandbox |
| --- | --- | --- | --- | --- |
| **Tools** | `gateway/src/tools/` | execute, hold the auth | eager, small | ✅ via the account |
| **Skills** | `plugins/*/skills/` | say when and how | lazy, ~zero | ✅ plain text |
| **References** | `plugins/*/references/` | house rules, once | read on demand | ✅ plain text |
| **Secrets** | Worker secrets | the key store | zero | ✅ never exposed |

Tools execute; skills teach; rules live once; secrets stay server-side. A skill
names the tools it drives — it never re-implements them — and
`scripts/check-drift.sh` fails when a skill names a tool that does not exist.

Keep the eager cost under control: lean tool descriptions, only the tools that are
used, and for a scheduled task, enable only the few tools it needs.

## Which plugin can work where

The same asymmetry decides which plugins can exist on which surface:

- A plugin reaches **every surface** when what it needs travels with the account
  (an OAuth connector — `arkad-tools`) or ships inside the plugin (text and assets —
  `arkad-documents`, `arkad-content`).
- It stops at **Claude Code** when it needs the machine: a shell, the filesystem,
  or a file-based credential such as the `gh` login (`arkad-dev`). Such a plugin
  ships no Cowork bundle (ADR 0004).

If a machine-bound capability is ever needed from Cowork, the answer is a gateway
tool doing that work server-side with its own credentials.

## Acting as a person

Some tools act as someone: log my hours, read my mailbox. They never take a user id
as an argument; they resolve the caller from the OAuth identity through
`gateway/src/people.js` (ADR 0003). A prompt injected into a document Claude is
reading cannot make a tool act as someone else.

## Distribution

| Surface | Installs from |
| --- | --- |
| Claude Code | the git repo: `/plugin marketplace add arkad-consulting/arkad-marketplace-template` |
| Cowork | the `.plugin` zip at the repo root, imported in Settings → Plugins |
| Any other MCP client (Codex, ChatGPT developer mode, …) | the gateway URL directly — same OAuth flow; the skills are Claude-only |

The `.plugin` zips are derived files: `scripts/build-bundles.sh` rebuilds them and
`scripts/check-drift.sh` fails when one is stale.

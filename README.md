<!-- template:start -->
# Arkad Marketplace Template

**The structure Arkad runs on: a private Claude plugin marketplace with skills,
tools behind one OAuth MCP gateway, and the checks that keep them in sync.
Fork it and run your own.**

At [Arkad Consulting](https://arkad-consulting.com) we build AI systems for
companies, and we use them on ourselves first. Every partner works in Claude Code
and Cowork through our own marketplace: web analytics, SEO research, website
audits, security scans, time tracking, client ticketing, mailbox drafts, branded
offers and reports, LinkedIn content. One install, one GitHub login, the same
tools and the same rules for everyone, on the laptop, in the chat and in
scheduled tasks.

This repository is that marketplace with the private parts taken out. The layout,
the rules and the checks are the ones we use; the tools are simple examples in
place of ours. No client data, no internal URLs, no credentials.

## Try it in one minute

In Claude Code:

```
/plugin marketplace add arkad-consulting/arkad-marketplace-template
/plugin install arkad-content@arkad
```

Then paste a draft post and ask *"review this post, can I publish it?"*. The
`arkad-documents` plugin works the same way (*"write a memo about…"*).
`arkad-tools` needs a gateway of your own: see *Quick start*.

## What you get

- **Four plugins, one of each kind you will need**: tools through a gateway,
  branded documents, writing rules, and a scaffolder that only makes sense on a
  developer machine.
- **An MCP gateway** on Cloudflare Workers: GitHub OAuth, access limited to your
  GitHub org, every API key kept server-side, three example tool families, and
  tests that run with plain Node (no network, no Cloudflare account).
- **The rules that stop it from rotting**: one `AGENTS.md` for every agent, specs
  before code, ADRs, a changelog, and a drift check in CI that fails when a skill
  names a tool that does not exist, a plugin changed without a version bump, or a
  Cowork bundle is stale.

## What to keep, what to replace

The structure is the product; the plugins and tools are **examples** of each
pattern, meant to be replaced with yours. Every plugin README and every tool file
says which pattern it shows and what to swap.

| Part | Keep | Replace with yours |
| --- | --- | --- |
| Marketplace layout, `scripts/`, CI, `AGENTS.md`, `.arkad/` rules and ADRs | ✅ | ADRs you disagree with |
| Gateway core: `index.js`, `github-auth.js`, `mcp.js` | ✅ register your tool families in `mcp.js` | |
| `gateway/src/people.js` | the mechanism | the two example people → your team |
| Tool `team_whoami` + skill `arkad-connect` | ✅ adapt the error table | |
| Tools `sitecheck_*`, `crm_*` + their skills | | ✅ your tools (keyless and secret-backed patterns) |
| `arkad-documents`: stylesheet, logo, memo | the skill's shape | ✅ your brand and document types |
| `arkad-content`: `voice.md`, `slop-phrases.md` | the skills, if the split suits you | ✅ your writing rules |
| `arkad-dev`: project setup steps | the `.no-bundle` pattern | ✅ how your team starts a project |
| `specs/0001-sitecheck-tool` | the shape of a spec | ✅ a worked example, start yours at 0002 |

## Why it is built this way

Claude reaches your tools from three places: Claude Code on a laptop, Cowork chat,
and scheduled tasks that run in an isolated sandbox. A key in a `.env` file
reaches only the first. A connector signed in through OAuth reaches all three. So
every tool sits behind one gateway, every key stays on the gateway, and the
plugins carry only text: when to use which tool, and the house rules.

Two pages with the details and the trade-offs: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Make it yours

Click **Use this template**, then in your new repository:

```
scripts/init-template.sh <slug> "<Company Name>" <github-org>
```

It renames every `arkad` plugin, skill, connector and folder after your company,
rebuilds the bundles and drops this introduction. Then follow *Quick start* below
from step 2.
<!-- template:end -->

# Arkad — Plugin Marketplace

Arkad's plugins for Claude Code and Cowork, plus the **Arkad MCP Gateway** that
serves their tools.

## Install

- **Claude Code**: add the marketplace once, then install by name:
  ```
  /plugin marketplace add arkad-consulting/arkad-marketplace-template
  /plugin install arkad-tools@arkad
  ```
  From a plain shell: `claude plugin marketplace add …` / `claude plugin install …`.
- **Cowork**: download the plugin's `.plugin` file from this repo, then
  **Settings → Plugins** → import it → enable.

`arkad-tools` signs in with **GitHub**; only active members of the `arkad-consulting`
org get in. There is no token to paste. In Claude Code use `/mcp` →
*Authenticate*; in claude.ai / Desktop / Cowork use **Settings → Connectors** →
*arkad-gateway* → **Connect**. Never use an authorization link generated inside a
chat.

## Plugins

| Plugin | What it does | Cowork | Claude Code |
| --- | --- | --- | --- |
| `arkad-tools` | The gateway connector and the skills that drive its tools: connection check, site check, CRM lookup. | [`arkad-tools.plugin`](arkad-tools.plugin) | `/plugin install arkad-tools@arkad` |
| `arkad-documents` | Branded, print-ready A4 HTML documents from templates shipped in the plugin. | [`arkad-documents.plugin`](arkad-documents.plugin) | `/plugin install arkad-documents@arkad` |
| `arkad-content` | The Arkad voice, a de-slop pass and a pre-publish review with a linter. | [`arkad-content.plugin`](arkad-content.plugin) | `/plugin install arkad-content@arkad` |
| `arkad-dev` | Scaffolds a new project with this repo's structure and creates the GitHub repo. | — (Claude Code only) | `/plugin install arkad-dev@arkad` |

### Which plugin works where

| | Claude Code | Cowork chat | Scheduled task |
| --- | --- | --- | --- |
| `arkad-tools` | ✅ | ✅ | ✅ |
| `arkad-documents` | ✅ | ✅ | ✅ |
| `arkad-content` | ✅ | ✅ | ✅ |
| `arkad-dev` | ✅ | ❌ | ❌ |

A plugin reaches every surface when what it needs travels with the Claude account
(an OAuth connector) or ships inside the plugin (text, assets). It stops at Claude
Code when it needs the machine: a shell, files, a `gh` login
([ADR 0004](.arkad/decisions/0004-machine-bound-plugins-ship-no-bundle.md)).

## Repo layout

```
.claude-plugin/marketplace.json   the marketplace: one entry per plugin
plugins/<plugin>/                 canonical skills, references and assets
  .claude-plugin/plugin.json      name, version, description (≤ 500 chars)
  skills/<skill>/SKILL.md         when and how; names tools, never re-implements them
  references/                     rules shared by several skills, written once
  .mcp.json                       (arkad-tools) the gateway connector
  .no-bundle                      (arkad-dev) Claude Code only, no Cowork zip
<plugin>.plugin                   Cowork bundles, built by scripts/build-bundles.sh
gateway/                          the MCP gateway (Cloudflare Worker)
  src/index.js                    OAuth provider wiring
  src/github-auth.js              GitHub login, org gate, health page
  src/mcp.js                      JSON-RPC handler and tool registry
  src/people.js                   the team list: GitHub login → person
  src/tools/<family>.js           one file per tool family
  test/                           smoke and auth tests, plain Node
.arkad/                           changelog, ADRs, environments, security model
specs/NNNN-slug/spec.md           one folder per unit of work
docs/ARCHITECTURE.md              why it is built this way
scripts/                          check-drift, build-bundles, init-template
```

## Quick start

1. **Rename** (only when starting from the template):
   `scripts/init-template.sh <slug> "<Company Name>" <github-org>`.
2. **Create a GitHub OAuth App** owned by your org (*Settings → Developer settings →
   OAuth Apps*). Homepage: your Worker URL. Callback: `https://<worker-url>/callback`.
3. **Set up the Worker** (needs a Cloudflare account, only for whoever deploys):
   ```
   cd gateway
   npm ci
   npx wrangler kv namespace create OAUTH_KV        # paste the id into wrangler.toml
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npm test
   npx wrangler deploy
   ```
   `ALLOWED_ORG` in `wrangler.toml` is the org whose members may sign in. Add the
   CRM secrets when you have a CRM, or delete `src/tools/crm.js`.
4. **Point the plugin at it**: put the deployed URL in `plugins/arkad-tools/.mcp.json`,
   list your team in `gateway/src/people.js`, then run `scripts/build-bundles.sh`
   and `scripts/check-drift.sh`.
5. **Push** and install as in *Install*. `team_whoami` proves the whole chain:
   connector, OAuth grant, org membership, team list.

## Day-to-day

**Add a tool.** Create or extend `gateway/src/tools/<family>.js` (names are
`<family>_<action>`), register the family in `src/mcp.js`, add checks to
`test/mcp.smoke.mjs`, name the tool in the skill that drives it, bump that plugin's
version. Same commit.

**Add a skill.** `plugins/<plugin>/skills/<skill>/SKILL.md` with `name` and an
imperative `description` listing the phrases that should trigger it. Keep the body
lean; put shared rules in `references/`. Bump the plugin version.

**Add a plugin.** `plugins/<name>/.claude-plugin/plugin.json`, an entry in
`.claude-plugin/marketplace.json`, a row in the tables above, then
`scripts/build-bundles.sh <name>`.

**Before every commit** touching `plugins/` or `gateway/src/tools/`:
```
scripts/build-bundles.sh && scripts/check-drift.sh && (cd gateway && npm test)
```
CI runs the same checks on every push.

**Non-trivial change?** Write `specs/NNNN-slug/spec.md` first
([`specs/README.md`](specs/README.md)). A decision that outlives it goes into an
ADR in `.arkad/decisions/`. Record the change under `## Unreleased` in
`.arkad/changelog.md`.

<!-- template:start -->
## About Arkad

[Arkad Consulting](https://arkad-consulting.com) is an AI and automation
consultancy based in Nice, France. We design the agents, tools and workflows a
team actually uses, and we leave them with the team: their repository, their
accounts, their rules.

Want this running for your company, wired to your own tools? Get in touch through
[arkad-consulting.com](https://arkad-consulting.com). Issues and pull requests on
this template are welcome.

Licensed under the [MIT License](LICENSE).
<!-- template:end -->

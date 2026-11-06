# arkad-tools

> **Example plugin.** It shows how a plugin exposes gateway tools: one connector,
> one skill per tool family, no code and no credential in the plugin. Replace
> `arkad-sitecheck` and `arkad-crm` (and their tools in `gateway/src/tools/`) with
> your own; keep `arkad-connect` and adapt its error table.

Registers the **Arkad MCP Gateway** as a connector (`arkad-gateway`) and ships the
skills that tell Claude when and how to use its tools.

The tools themselves live in [`gateway/src/tools/`](../../gateway/src/tools/); this
plugin holds no code and no credential. Tools execute, skills teach.

| Skill | Drives | Use it for | Shows | Your move |
| --- | --- | --- | --- | --- |
| `arkad-connect` | `team_whoami` | first sign-in, checking the connection, fixing auth errors | a tool that acts as the caller; sign-in help per surface | **keep**, adapt the error table |
| `arkad-sitecheck` | `sitecheck_status` | a quick health check of a public URL | a keyless tool | **replace** |
| `arkad-crm` | `crm_search_contacts`, `crm_get_contact` | finding a contact before a call or an e-mail | a tool backed by a third-party API, its key kept on the gateway | **replace** |

To replace one: write the tool family in `gateway/src/tools/<family>.js`, register it
in `gateway/src/mcp.js`, add its checks to `gateway/test/mcp.smoke.mjs`, write
`skills/<skill>/SKILL.md` naming the tools, delete the example you no longer need,
bump this plugin's version. `scripts/check-drift.sh` tells you what you missed.

## Sign-in

No token to paste. The connector signs in with **GitHub**, and only active members
of the gateway's GitHub org get through. See the `arkad-connect` skill for where to
click on each surface.

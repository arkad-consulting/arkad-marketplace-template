# Environments and secrets

Where each secret lives and who can change it. **Never the value.**

## Gateway (Cloudflare Worker `arkad-mcp-gateway`)

| Name | Kind | Used by | Set with | Held by |
| --- | --- | --- | --- | --- |
| `GITHUB_CLIENT_ID` | secret | sign-in (`github-auth.js`) | `wrangler secret put` | gateway owner |
| `GITHUB_CLIENT_SECRET` | secret | sign-in (`github-auth.js`) | `wrangler secret put` | gateway owner |
| `CRM_API_URL` | secret | `crm_*` tools | `wrangler secret put` | gateway owner |
| `CRM_API_KEY` | secret | `crm_*` tools | `wrangler secret put` | gateway owner |
| `ALLOWED_ORG` | plain var | sign-in allowlist | `wrangler.toml` `[vars]` | in git |
| `OAUTH_KV` | KV binding | OAuth grants and tokens | `wrangler.toml` | in git (id only) |

Local development: the same names in `gateway/.dev.vars` (gitignored). The list of
names is `gateway/.env.example`.

## Who is who

`gateway/src/people.js` — GitHub login → name, work e-mail. Code, reviewed in a commit,
not a secret.

## Rotating a secret

`wrangler secret put <NAME>` replaces it with no redeploy. Rotating
`GITHUB_CLIENT_SECRET` does not log anyone out: existing grants live in `OAUTH_KV`.
To revoke everyone, delete the grants in `OAUTH_KV`.

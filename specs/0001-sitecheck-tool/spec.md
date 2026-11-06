# 0001 — `sitecheck_status`: a keyless example tool

Issues: (link the issue here)
Status: shipped (template example)

A worked example of the spec shape. Replace it with your own first spec, or keep it as a
reference and start yours at 0002.

## Requirements

1. A tool `sitecheck_status` takes a `url` and returns HTTP status, response time, final
   URL and which of six common security headers are present or missing.
2. It refuses anything that is not a public http(s) host: `localhost`, IP literals
   (v4 and v6), other schemes, malformed input.
3. It needs no secret.
4. A skill tells Claude when to use it and how to report the result in three lines.

## Design

- One `fetch` with `redirect: 'follow'`; the time is measured around it.
- The host check is a deny-list of the obvious cases. The Worker runtime cannot reach a
  private network anyway; the check exists so the tool answers clearly instead of with a
  confusing network error.
- Rejected: a HEAD request. Many servers answer HEAD differently from GET, which would
  make the status misleading.

## Verification

- `cd gateway && npm test` → the `sitecheck_status refuses …` checks (5 inputs) and the two
  header checks pass against a stubbed `fetch`.
- `./scripts/check-drift.sh` → `sitecheck_status` is mentioned by `arkad-sitecheck` and
  defined in `gateway/src/tools/sitecheck.js`.

## Tasks

- [x] `gateway/src/tools/sitecheck.js`, registered in `src/mcp.js`
- [x] smoke checks in `gateway/test/mcp.smoke.mjs`
- [x] skill `plugins/arkad-tools/skills/arkad-sitecheck/SKILL.md`, plugin version bumped
- [x] changelog entry under `## Unreleased`

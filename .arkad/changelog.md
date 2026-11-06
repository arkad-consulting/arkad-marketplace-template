# Changelog

Meaningful operational and architecture changes, [Keep a Changelog](https://keepachangelog.com/)
style, newest first. Deploy-based project → each release section is a deploy date.
Record entries under `## Unreleased` in the same change that ships them; roll into a
dated section on deploy, with the Worker version id `wrangler deploy` printed.

One changelog for the whole monorepo: plugins and gateway.

## Unreleased

### Changed
- The READMEs say which parts are examples to replace: a keep/replace table in the root
  README, an "Example plugin" note and a "Your move" column in each plugin README, a
  keep/replace line at the top of each gateway tool file and of `people.js`. Plugins
  0.1.1. Skills unchanged: notes for humans stay out of what the agent reads.

### Added
- Initial structure from the marketplace template: plugins `arkad-tools` 0.1.0,
  `arkad-documents` 0.1.0, `arkad-content` 0.1.0, `arkad-dev` 0.1.0; the gateway with the
  `team_*`, `sitecheck_*` (spec 0001) and `crm_*` tool families; ADRs 0001–0004.

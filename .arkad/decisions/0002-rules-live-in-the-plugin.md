# ADR 0002: Tools execute, skills teach, rules live once in the plugin

## Status

Accepted.

## Context

Instructions for how to use a tool, and house rules (voice, document layout), had been
written in several places: prompts of scheduled tasks, shared folders, personal notes.
Copies drifted, and each person's agent applied a slightly different version.

## Decision

- **Tools** (gateway) do the work and hold the credentials.
- **Skills** (plugins) say when to use which tool and how. They name tools; they never
  re-implement them.
- **Rules** that several skills share live in the plugin's `references/`, in one file
  each. Skills point to them instead of restating them.
- A rule changes through a plugin release: content change → version bump → changelog.

Rejected: keeping rules in a shared folder and copying them into the plugin at release
time. Two copies and a sync step someone forgets.

## Consequences

- Everyone gets the same rules with one install, on every surface.
- Changing a rule takes a commit and an update, not a quick edit. Slower, on purpose: the
  skill an agent runs and the rule a person reads cannot disagree.
- `scripts/check-drift.sh` enforces the joins: every tool a skill names exists, every
  changed plugin bumped its version, every bundle matches its source.

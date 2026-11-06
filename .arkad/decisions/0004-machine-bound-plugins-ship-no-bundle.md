# ADR 0004: A plugin that needs the machine ships no Cowork bundle

## Status

Accepted.

## Context

Cowork installs a plugin from a `.plugin` zip. A plugin works on every surface when what
it needs either travels with the Claude account (an OAuth connector) or ships inside the
plugin (text, assets). It cannot work outside Claude Code when it needs the machine: a
shell, the local filesystem, or a file-based credential such as the `gh` login.

## Decision

- Such a plugin (here: `arkad-dev`) carries a `.no-bundle` file whose first line says why,
  and has no `.plugin` zip. `scripts/check-drift.sh` skips it and prints the reason.
- It is still listed in `marketplace.json`, so Claude Code users install it by name.
- If the capability is ever needed from Cowork, the answer is a gateway tool doing the
  work server-side with its own credentials, not a bundle.

## Consequences

- Cowork users never see a plugin that fails on its first command.
- The README's "which plugin works where" table must say so; keep it in step.

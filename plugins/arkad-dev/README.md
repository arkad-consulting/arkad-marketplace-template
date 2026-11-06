# arkad-dev

> **Example plugin.** It shows a plugin that needs the machine and therefore ships
> no Cowork bundle. The steps in `skills/new-project/SKILL.md` are a starting
> point: replace them with how your team starts a project, or point the skill at
> your own scaffolding tool. Keep the `.no-bundle` marker as long as it needs a
> shell.

Scaffolds a new code project with the governance this repo uses: `AGENTS.md` as the
single instruction file, `specs/` for units of work, ADRs and a changelog.

**Claude Code only.** It runs `git` and `gh` on your machine; Cowork chat and
scheduled tasks have neither a local shell nor your `gh` login. So this plugin ships
**no `.plugin` bundle** — it carries a `.no-bundle` marker instead, and the drift
check skips it. Absent from Cowork is better than present and failing on the first
command ([ADR 0004](../../.arkad/decisions/0004-machine-bound-plugins-ship-no-bundle.md)).

```
/plugin install arkad-dev@arkad
```

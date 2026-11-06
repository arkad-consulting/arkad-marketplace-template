---
name: new-project
description: ALWAYS use this skill when the user says "new project", "start a new repo", "scaffold a project", "set up a repository", or "bring this repo under our structure". Asks what is being built, creates the Arkad project structure (AGENTS.md, CLAUDE.md pointer, specs/, .arkad/ with changelog and ADRs), makes the first commit and creates the GitHub repository. Claude Code only — needs a local shell, git and gh.
---

# New project — the Arkad structure

## 1. Ask (one message, all at once)

- What are we building, in one sentence? Who uses it?
- Name of the repository (kebab-case).
- Public or private? (Default: private.)
- Language / stack, if already decided.

## 2. Create

In a new folder named after the repository (or the current repo, if the user asked to
bring it under the structure — then add only what is missing, never overwrite):

```
AGENTS.md                 canonical agent instructions: what this is, how to run it, the rules
CLAUDE.md                 one line: @AGENTS.md
README.md                 what it is and how to start, for a human
specs/README.md           copy of this marketplace's specs/README.md
.arkad/changelog.md  "## Unreleased" heading, Keep a Changelog style
.arkad/decisions/0001-<first-decision>.md   the stack choice, with "## Status" Accepted
.gitignore                for the chosen stack, plus .env and .DS_Store
```

`AGENTS.md` holds the rules, once. Every other agent file points to it.

## 3. Publish

```
git init -b main && git add -A && git commit -m "chore: initial structure"
gh repo create <org>/<name> --private --source . --push     # --public only if asked
```

Show the repository URL. If `gh` is not logged in, stop and tell the user to run
`gh auth login` — do not try another way to authenticate.

## Rules

- Never create a public repository unless the user said public.
- Pin every dependency to an exact version; commit the lockfile.
- No secret in any file. `.env.example` lists names, never values.

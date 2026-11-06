# Slop phrases

Phrases that make a text read as AI-written. `skills/post-review/scripts/lint_post.py`
reads every `## Lint — <lang>` section of this file: one phrase per `- ` line,
matched case-insensitively. `all` applies to every language. Add a language by
adding a section.

## Patterns (for people and agents, not linted)

- The secret-reveal opener ("Here's what nobody tells you about…").
- The reflex contrast "It's not X, it's Y" used as a crutch.
- Groups of three by default; every sentence the same length.
- A rhetorical question answered in the next line.
- A closing line that summarises the post.
- A list ending in arrows (→) as decoration.

## Lint — all

- game-changer
- game changer
- let that sink in
- in today's fast-paced world
- unlock the power of

## Lint — en

- delve into
- it's worth noting that
- in the ever-evolving landscape
- navigate the complexities
- a testament to
- seamlessly
- leverage synergies

## Lint — fr

- dans un monde en constante évolution
- il est important de noter que
- plongeons dans
- véritable levier

## Lint — it

- in un mondo in continua evoluzione
- è importante sottolineare che
- immergiamoci

# arkad-content

> **Example plugin.** It shows how to put writing rules in a plugin: the rules in
> `references/`, skills that read them, a script with tests. The voice and the
> phrase lists here are placeholders: replace `references/voice.md` and
> `references/slop-phrases.md` with your own rules. Keep the two skills if the
> split (clean the text / judge the post) suits you; otherwise replace them too.

Writing rules that every team member — and every agent — applies the same way.

The rules live in [`references/`](references/), once. The skills read them; they
never restate them. Change a rule → bump the plugin version → everyone gets it on
the next update. That is the whole point of putting rules in a plugin rather than
in a shared folder or a prompt.

| Skill | Use it for | Shows | Your move |
| --- | --- | --- | --- |
| `deslop` | removing the phrases and structures that make a text sound AI-written | a skill that applies a reference file | keep or replace |
| `post-review` | a publish / fix / rethink verdict on a post before it goes out, with `scripts/lint_post.py` | a skill with a tested script that reads the same reference | keep or replace |

| Reference | Holds | Your move |
| --- | --- | --- |
| `references/voice.md` | how Arkad sounds: tone, person, what we never say | **replace** with your voice |
| `references/slop-phrases.md` | the phrase lists the linter reads, per language | **replace** or extend; keep the `## Lint — <lang>` headings the script reads |

Run the linter's tests: `python3 -I skills/post-review/scripts/test_lint_post.py`.

---
name: post-review
description: ALWAYS use this skill when the user says "review this post", "can I publish this", "check my post before posting", "is this post good", or "proofread this post". Gives a publish / fix / rethink verdict on a social post against the Arkad voice, runs the lint script when a shell is available, and lists the exact fixes. NOT for cleaning AI phrasing alone (use deslop).
---

# Post review — publish, fix or rethink

Read `../../references/voice.md` and `../../references/slop-phrases.md` first.

## Steps

1. **Lint** (when a shell is available):
   `python3 -I scripts/lint_post.py <file> --lang <en|fr|it>` — or `-` to read stdin.
   It prints one JSON finding per line and exits 1 when it found something.
   Without a shell, apply the same checks by reading.
2. **Read as the reader.** Does the first line make them stop? Is there one fact they
   can check? Does the close tell them what to do with it?
3. **Check the never-list** in `voice.md`: unbacked claims, names without permission,
   engagement bait.

## Verdict

- **Publish** — nothing to change, or only lint nits the author can take or leave.
- **Fix** — the idea holds; list each fix as *quote → replacement*.
- **Rethink** — the post has no claim, no fact, or makes a claim we cannot back. Say
  which, in one sentence, and stop: do not rewrite a post that should not exist.

Lead with the verdict word. Then the fixes. Nothing else.

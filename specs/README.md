# specs/

One folder per unit of work: `NNNN-slug/spec.md`, numbered in the order they were
started, never renumbered.

## Shape

A spec is one file with four sections:

- **Requirements** — what must be true when this is done, numbered, each testable.
- **Design** — how, and the trade-offs taken. Name what was rejected.
- **Verification** — how each requirement was actually checked. Commands and
  observed results, not intentions.
- **Tasks** — the checklist, ticked as they land.

Head the file with the issues it covers (`Issues: #1 #2`) and a status line.

## Rules

1. **Non-trivial work gets a spec before the code**, not after. Trivial = a typo,
   a one-line fix, a version bump.
2. **A spec is finished when Verification says how it was proven.** "Should work"
   is not verification; a command and its output is.
3. **Specs are append-only in spirit.** When reality diverges, add a note saying
   what changed and why — do not silently rewrite history into what shipped.
4. **A decision that outlives the spec belongs in an ADR** (`.arkad/decisions/`).
   The spec says what was built; the ADR says why the shape is what it is, and
   stays relevant after the work is done.
5. `scripts/check-drift.sh` fails if a spec has no status line, so an abandoned
   spec cannot sit here looking active.

## Status values

`draft` · `in-progress` · `shipped <date>` · `superseded by NNNN` · `abandoned <why>`

# ADR 0003: Tools act as the caller, resolved from the OAuth identity

## Status

Accepted.

## Context

Some tools act as a person: they log *my* hours, read *my* mailbox, reply on a ticket as
*me*. The easy design is a `user_id` argument. Then any team member — or any prompt
injected into a document Claude is reading — can act as anyone else.

## Decision

- A tool that acts as a person takes **no identity argument**. It reads the GitHub
  identity the OAuth layer put on the request (`ctx.props`) and resolves it with
  `gateway/src/people.js`.
- `people.js` is the one team list: GitHub login → name, work e-mail, and the ids each
  downstream system knows the person by. It is code, changed by a reviewed commit.
- A member of the org who is not in the list can use shared tools, not personal ones,
  and gets an error that says who to ask.

## Consequences

- Impersonation through a tool argument is impossible by construction.
- One admin credential per downstream system is enough; the gateway scopes each call to
  the caller.
- Adding a person is two steps: the GitHub org (access) and `people.js` (identity).

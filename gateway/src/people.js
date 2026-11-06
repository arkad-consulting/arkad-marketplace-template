/**
 * The team, in one place.
 * The two people below are examples: replace them with your team.
 *
 * Who may use the gateway is decided by the GitHub org (github-auth.js); this
 * list says WHO each member is, for every tool that acts as a person — their
 * name and work e-mail here, and later their user id in a time tracker, the
 * only mailbox they may connect, the identity a ticket desk knows them by.
 * GitHub logins are compared lowercase. A member of the org who is not listed
 * can use the shared tools, not the personal ones.
 *
 * It is code, not configuration, on purpose: a change of who-is-who is a
 * reviewed commit, not a secret someone edits in a dashboard.
 */
export const PEOPLE = [
  { github: 'ada-example', name: 'Ada Example', email: 'ada@example.com' },
  { github: 'grace-example', name: 'Grace Example', email: 'grace@example.com' },
];

/** The listed person for a GitHub login, or null. */
export function findPerson(login) {
  const l = String(login ?? '').toLowerCase();
  return (l && PEOPLE.find((p) => p.github === l)) || null;
}

/** The person behind the authenticated request (ctx.props), or a clear refusal. */
export function personOf(user) {
  if (!user?.username) throw new Error('No authenticated GitHub identity on the request');
  const person = findPerson(user.username);
  if (!person) {
    throw new Error(`GitHub account "${user.username}" is not in the team list (gateway/src/people.js): ask the gateway owner to add it.`);
  }
  return person;
}

/**
 * team_* — who is calling.
 * Keep it: every gateway needs a connection check, and this is the pattern
 * for every tool that acts as a person.
 *
 * The smallest tool that acts as the caller: it reads the GitHub identity the
 * OAuth layer put on the request and resolves it against src/people.js. Copy
 * this shape for any tool that must act as a person (a time tracker, a
 * personal mailbox, a ticket desk): never take a user id as an argument.
 */
import { personOf } from '../people.js';

export const teamTools = [
  {
    name: 'team_whoami',
    description: 'Who the gateway thinks you are: your GitHub login and your entry in the team list. Use it to check that the connector works.',
    inputSchema: { type: 'object', properties: {} },
  },
];

export async function teamExecute(name, args, env, user) {
  if (name === 'team_whoami') {
    const person = personOf(user);
    return { github: user.username, name: person.name, email: person.email };
  }
  throw new Error(`Unknown tool: ${name}`);
}

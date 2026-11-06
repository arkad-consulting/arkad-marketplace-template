---
name: arkad-crm
description: ALWAYS use this skill when the user says "find this contact", "who is our contact at", "look up in the CRM", "what do we know about", or "the e-mail of". Drives the arkad-gateway crm_search_contacts and crm_get_contact tools to find a contact and read their record. Read-only.
---

# CRM — find a contact

## Flow

1. `crm_search_contacts` with what the user gave (a name, an e-mail, a company).
   Keep `limit` small (5–10): the user wants one person, not a list.
2. **One match** → `crm_get_contact` with its `id`, then answer.
   **Several** → show them (name, company, e-mail) and ask which one. Never pick.
   **None** → say so, and suggest the closest search to try (company instead of name).
3. Answer with what the user asked for first; the rest of the record only if useful.

## Rules

- The CRM is the source of truth. Do not complete a record with a guess, and do not
  "remember" a contact from earlier in the conversation instead of reading it.
- Contact data is personal data: quote only what the task needs.
- If the tool says the CRM is not configured, the gateway owner has not set its
  secrets yet — say that, do not retry.

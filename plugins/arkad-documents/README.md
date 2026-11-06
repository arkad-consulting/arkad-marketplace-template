# arkad-documents

> **Example plugin.** It shows how to ship a design system and document templates
> inside a plugin, so documents come out branded on every surface. Replace the
> colours and fonts in `arkad-docs.css`, the logo, and the memo with your own
> document types (offers, reports, minutes, NDAs…); keep the shape of the skill.

Branded documents as print-ready A4 HTML. Everything the skill needs — the
stylesheet, the logo, the templates — ships **inside** the plugin, so it works on
every surface (Claude Code, Cowork chat, scheduled tasks) with no connector.

```
skills/arkad-documents/
  SKILL.md                      when and how to fill a template      keep, update its table
  assets/arkad-docs.css         the design system: A4 page rules     replace the tokens in :root
  assets/brand/arkad-logo.svg   the logo, inlined by the templates   replace
  assets/templates/memo.html    one template per document type       replace, add yours
```

To add a document type: add `assets/templates/<type>.html` using the same
stylesheet and placeholders, then add one row to the table in `SKILL.md`. Bump the
plugin version and rebuild its bundle.

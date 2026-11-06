---
name: arkad-documents
description: ALWAYS use this skill when the user asks for a branded Arkad document — "write a memo", "internal memo about", "make this an Arkad document", "put this on our letterhead", "print-ready version of". Fills the templates shipped in this plugin and returns one self-contained, print-ready A4 HTML file in the Arkad visual identity. Write the document in the language the user used.
---

# Arkad documents — branded, print-ready A4 HTML

## Templates

| Document | Template | Use for |
| --- | --- | --- |
| Internal memo | `assets/templates/memo.html` | a decision, an update or a proposal to the team, 1–2 pages |

## Steps

1. **Pick the template** from the table. No template fits → say so and propose the
   closest; do not invent a layout.
2. **Collect what is missing** before writing: title, recipients, date, author, and
   the content. Ask once, in one message, for everything missing.
3. **Fill the template.** Replace every `{{placeholder}}`. Keep the structure and
   the class names; add or remove sections only where the template says so.
4. **Inline the assets** so the file stands alone: paste `assets/arkad-docs.css`
   into the `<style>` tag and `assets/brand/arkad-logo.svg` where the template marks
   `{{logo}}`. No external fonts, scripts or images.
5. **Check before handing over:** no `{{` left in the file, today's date where the
   template asks for one, page breaks only between sections.
6. Save as `YYYYMMDD-<type>-<slug>.html` and give the user the path.

## Rules

- Never invent a fact, an amount or a name to fill a placeholder. Leave
  `[to confirm: …]` and list them in your reply.
- Use the stylesheet's colours and type only. No inline style that overrides them.
- A PDF is the browser's *Print → Save as PDF* of this file: the stylesheet already
  sets A4 margins.

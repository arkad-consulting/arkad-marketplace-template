---
name: arkad-sitecheck
description: ALWAYS use this skill when the user says "is this site up", "check this URL", "quick site check", "does this site have security headers", or gives a URL and asks whether it responds. Drives the arkad-gateway sitecheck_status tool for a one-shot, read-only check of a public URL. NOT a full audit or a vulnerability scan.
---

# Site check — one request, one answer

`sitecheck_status` fetches a public URL **once** and returns its HTTP status, the
response time, the final URL after redirects, and which common security headers
are present or missing.

## Flow

1. Take the URL as given. If the user gave a bare domain, prefix `https://`.
2. Call `sitecheck_status` with `url`.
3. Answer in three lines: up or not (status), how fast, what is missing.
   Name a missing header only with what it protects against, in one clause.

## Boundary

- One request is a snapshot, not monitoring: say so if the user asks "is it stable".
- The tool refuses `localhost` and IP addresses on purpose; do not try to work around it.
- A missing header is a finding to report, not a vulnerability to claim.

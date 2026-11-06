#!/usr/bin/env python3
"""Lint a social post against the Arkad content rules.

Usage: lint_post.py <file | -> [--lang en]

Prints one JSON finding per line ({"check", "detail"}) and exits 1 when there
is at least one. The phrase lists come from references/slop-phrases.md, so a
rule change is a change to that file, not to this script.
"""
import argparse
import json
import re
import sys
from pathlib import Path

PHRASES = Path(__file__).resolve().parents[3] / "references" / "slop-phrases.md"
MAX_CHARS = 3000
MAX_HOOK = 150
MAX_HASHTAGS = 3
MAX_EM_DASHES = 2


def load_phrases(lang, path=PHRASES):
    """Phrases of the `Lint — all` section plus the `Lint — <lang>` section."""
    phrases, section = [], None
    for line in path.read_text(encoding="utf-8").splitlines():
        head = re.match(r"^## Lint — (\w+)\s*$", line)
        if head:
            section = head.group(1)
        elif line.startswith("## "):
            section = None
        elif section in ("all", lang) and line.startswith("- "):
            phrases.append(line[2:].strip().lower())
    return phrases


def lint(text, lang="en"):
    findings = []
    low = text.lower()
    for phrase in load_phrases(lang):
        if phrase in low:
            findings.append({"check": "slop_phrase", "detail": phrase})
    if len(text) > MAX_CHARS:
        findings.append({"check": "too_long", "detail": f"{len(text)} characters (max {MAX_CHARS})"})
    hook = next((l for l in text.splitlines() if l.strip()), "")
    if len(hook) > MAX_HOOK:
        findings.append({"check": "long_hook", "detail": f"first line is {len(hook)} characters (max {MAX_HOOK})"})
    tags = re.findall(r"(?<!\w)#\w+", text)
    if len(tags) > MAX_HASHTAGS:
        findings.append({"check": "hashtags", "detail": f"{len(tags)} hashtags (max {MAX_HASHTAGS})"})
    dashes = text.count("—")
    if dashes > MAX_EM_DASHES:
        findings.append({"check": "em_dashes", "detail": f"{dashes} em dashes (max {MAX_EM_DASHES})"})
    return findings


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("file", help="post file, or - for stdin")
    ap.add_argument("--lang", default="en")
    args = ap.parse_args()
    text = sys.stdin.read() if args.file == "-" else Path(args.file).read_text(encoding="utf-8")
    findings = lint(text, args.lang)
    for f in findings:
        print(json.dumps(f, ensure_ascii=False))
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())

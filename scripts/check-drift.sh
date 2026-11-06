#!/usr/bin/env bash
# Verifies the derived surfaces of this repo are in sync with their sources of
# truth. Run before committing anything under plugins/ or gateway/src/tools/
# (see AGENTS.md checklist). CI runs it on every push.
#
#   1. Skill <-> gateway tools: every tool name mentioned in a SKILL.md must
#      exist in gateway/src/tools/*.js (catches renamed/removed tools and
#      typos). Gateway tools no skill mentions are reported as info only.
#   2. .plugin bundles: each <plugin>.plugin zip at repo root must contain
#      exactly the current content of plugins/<plugin>/ (Cowork installs from
#      the zip, not the live tree).
#   3. plugin.json version: any change under plugins/<p>/ must come with a
#      version bump in its manifest, else clients never fetch the new bundle.
#   4. Specs and ADRs carry a status.
#   5. Plugin descriptions fit the 500-character marketplace limit.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail=0

# ── 1. Skill mentions vs gateway tool definitions ────────────────────────
# Tool names are <family>_<action>, and <family> is the file name in
# gateway/src/tools/. Only words with a known family prefix count as mentions.
prefixes=""
gateway_tools=""
for f in "$ROOT"/gateway/src/tools/*.js; do
  prefixes="$prefixes $(basename "$f" .js)"
  gateway_tools="$gateway_tools
$(grep -oE "name: '[a-z0-9_]+'" "$f" | sed "s/name: '//;s/'//")"
done
prefix_re="$(echo $prefixes | tr ' ' '|')"

# Trailing-underscore matches come from family wildcards written in prose
# ("the crm_* tools"): no real tool name ends in '_', so drop them.
mentioned=$(grep -rhoE "(${prefix_re})_[a-z0-9_]+" "$ROOT"/plugins/*/skills/*/SKILL.md \
  | grep -v '_$' | sort -u)

for name in $mentioned; do
  if ! echo "$gateway_tools" | grep -qx "$name"; then
    echo "FAIL: '$name' is mentioned in a SKILL.md but not defined in gateway/src/tools/"
    grep -rln "$name" "$ROOT"/plugins/*/skills/*/SKILL.md | sed 's/^/      /'
    fail=1
  fi
done

for name in $(echo "$gateway_tools" | sort -u | grep -v '^$'); do
  if ! echo "$mentioned" | grep -qx "$name"; then
    echo "info: gateway tool '$name' is not mentioned in any SKILL.md"
  fi
done

# ── 2. .plugin bundles vs plugins/ tree ──────────────────────────────────
for plugin_dir in "$ROOT"/plugins/*/; do
  plugin="$(basename "$plugin_dir")"
  bundle="$ROOT/$plugin.plugin"
  # A plugin with no Cowork surface (Claude Code only) says so with a marker
  # instead of shipping a bundle that fails on its first command (ADR 0004).
  if [ -f "$plugin_dir/.no-bundle" ]; then
    echo "info: $plugin ships no .plugin bundle ($(head -1 "$plugin_dir/.no-bundle"))"
    continue
  fi
  if [ ! -f "$bundle" ]; then
    echo "FAIL: $plugin.plugin bundle missing at repo root (run scripts/build-bundles.sh)"
    fail=1
    continue
  fi
  tmp="$(mktemp -d)"
  unzip -qq "$bundle" -d "$tmp"
  if ! diff -r --exclude=.DS_Store --exclude=__pycache__ "$tmp" "$plugin_dir" > /dev/null 2>&1; then
    echo "FAIL: $plugin.plugin is stale vs plugins/$plugin/ (run scripts/build-bundles.sh)"
    diff -rq --exclude=.DS_Store --exclude=__pycache__ "$tmp" "$plugin_dir" 2>&1 | head -5 | sed 's/^/      /'
    fail=1
  fi
  rm -rf "$tmp"
done

# ── 3. plugin.json version bumped when the plugin changed ────────────────
# Cowork and `/plugin install` decide whether to update from the manifest
# version. Shipping changed skills under an unchanged version means installed
# users silently keep the old bundle, so a content change without a version
# bump is a release bug, not a style nit.
if git -C "$ROOT" rev-parse --verify HEAD > /dev/null 2>&1; then
  for plugin_dir in "$ROOT"/plugins/*/; do
    plugin="$(basename "$plugin_dir")"
    manifest="plugins/$plugin/.claude-plugin/plugin.json"
    git -C "$ROOT" cat-file -e "HEAD:$manifest" 2>/dev/null || continue   # new plugin
    changed=$(git -C "$ROOT" diff HEAD --name-only -- "plugins/$plugin/" | grep -v "^$manifest$" || true)
    [ -z "$changed" ] && continue
    old_version=$(git -C "$ROOT" show "HEAD:$manifest" | grep -oE '"version"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1)
    new_version=$(grep -oE '"version"[[:space:]]*:[[:space:]]*"[^"]+"' "$ROOT/$manifest" | head -1)
    if [ "$old_version" = "$new_version" ]; then
      echo "FAIL: plugins/$plugin/ changed but $manifest version is still ${new_version:-unset}"
      echo "      bump it, or installed users keep the old bundle:"
      echo "$changed" | head -5 | sed 's/^/        /'
      fail=1
    fi
  done
fi

# ── 4. specs and ADRs carry a status ─────────────────────────────────────
# A spec with no status is indistinguishable from an abandoned one, and an ADR
# with no status is indistinguishable from a draft nobody accepted.
for spec in "$ROOT"/specs/*/spec.md; do
  [ -e "$spec" ] || continue
  if ! grep -qE '^Status:' "$spec"; then
    echo "FAIL: specs/$(basename "$(dirname "$spec")")/spec.md has no 'Status:' line"
    echo "      one of: draft | in-progress | shipped <date> | superseded by NNNN | abandoned <why>"
    fail=1
  fi
done

for adr in "$ROOT"/.arkad/decisions/*.md; do
  [ -e "$adr" ] || continue
  if ! grep -qE '^## Status' "$adr"; then
    echo "FAIL: $(basename "$adr") has no '## Status' section"
    fail=1
  fi
done

# ── 5. plugin descriptions fit the Claude marketplace limit ──────────────
# The Claude Team / Cowork marketplace sync drops a plugin whose description is
# over 500 characters ("Plugin description must be at most 500 characters").
node -e '
const fs = require("fs"), path = require("path"), root = process.argv[1];
const entries = JSON.parse(fs.readFileSync(path.join(root, ".claude-plugin/marketplace.json"), "utf8")).plugins
  .map(p => [".claude-plugin/marketplace.json (" + p.name + ")", p.description]);
for (const d of fs.readdirSync(path.join(root, "plugins"))) {
  const m = path.join("plugins", d, ".claude-plugin/plugin.json");
  if (fs.existsSync(path.join(root, m))) entries.push([m, JSON.parse(fs.readFileSync(path.join(root, m), "utf8")).description]);
}
let bad = 0;
for (const [where, desc] of entries) {
  const n = [...(desc || "")].length;
  if (n > 500) { console.log("FAIL: " + where + " description is " + n + " characters (max 500)"); bad = 1; }
}
process.exit(bad);
' "$ROOT" || fail=1

if [ "$fail" = 0 ]; then
  echo "OK: skills, tools, bundles, versions, specs and ADRs are in sync."
fi
exit $fail

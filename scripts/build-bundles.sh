#!/usr/bin/env bash
# Rebuilds the <plugin>.plugin zip at the repo root for every plugin that has a
# Cowork surface (no .no-bundle marker). Cowork installs from these files, not
# from plugins/, so run this after any edit under plugins/.
#
#   scripts/build-bundles.sh              # every plugin
#   scripts/build-bundles.sh arkad-tools   # one plugin
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/plugins"

for plugin in ${1:-*}; do
  [ -d "$plugin" ] || { echo "no such plugin: $plugin" >&2; exit 1; }
  if [ -f "$plugin/.no-bundle" ]; then
    echo "skip  $plugin ($(head -1 "$plugin/.no-bundle"))"
    continue
  fi
  rm -f "$ROOT/$plugin.plugin"
  (cd "$plugin" && zip -qr -X "$ROOT/$plugin.plugin" . -x '*.DS_Store' -x '*__pycache__*')
  echo "built $plugin.plugin"
done

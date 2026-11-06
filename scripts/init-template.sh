#!/usr/bin/env bash
# Turns this template into your marketplace: replaces the placeholders in every
# file and file name, then rebuilds the .plugin bundles. Run it once, right
# after creating your repository from the template.
#
#   scripts/init-template.sh <slug> "<Company Name>" <github-org>
#   scripts/init-template.sh globex "Globex Corporation" globex-corp
#
#   arkad                       -> <slug>             (plugins, skills, connector, Worker, .arkad/)
#   Arkad                       -> <Company Name>     (prose)
#   arkad-consulting            -> <github-org>       (the org whose members may sign in)
#   arkad-marketplace-template  -> <slug>-marketplace (your repository)
#   https://arkad-consulting.com -> https://example.com (set your own site after)
#
# The LICENSE keeps Arkad Consulting's copyright notice, as the MIT license asks.
#
# Still yours to do afterwards (README "Quick start"): the Worker subdomain in
# plugins/<slug>-tools/.mcp.json, the KV id in gateway/wrangler.toml, the team
# list in gateway/src/people.js, and the secrets.
set -euo pipefail

if [ $# -ne 3 ]; then
  sed -n '2,19p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
fi
slug="$1" name="$2" org="$3"
[[ "$slug" =~ ^[a-z][a-z0-9-]*$ ]] || { echo "slug must be lowercase kebab-case: $slug" >&2; exit 2; }
[[ "$org" =~ ^[A-Za-z0-9-]+$ ]] || { echo "not a GitHub org name: $org" >&2; exit 2; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Text files tracked or not, outside .git, node_modules and the bundles.
files=$(find . -type f \
  -not -path './.git/*' -not -path '*/node_modules/*' -not -path '*/.wrangler/*' \
  -not -name '*.plugin' -not -name '*.png' -not -name '*.jpg' \
  -not -name 'init-template.sh' -not -name 'LICENSE')

# The README's "using this template" part is for people choosing the template,
# not for the marketplace it becomes: drop it first.
perl -0pi -e 's/<!-- template:start -->.*?<!-- template:end -->\n?//gs; s/\A\s+//' README.md

# perl, not sed: in-place editing is the same on macOS and Linux.
SLUG="$slug" NAME="$name" ORG="$org" perl -pi -e '
  s#https://arkad-consulting\.com#https://example.com#g;
  s/arkad-marketplace-template/$ENV{SLUG}-marketplace/g;
  s/arkad-consulting/$ENV{ORG}/g;
  s/Arkad/$ENV{NAME}/g;
  s/arkad/$ENV{SLUG}/g;
' $files

# Rename paths that carry the slug, deepest first so parents move last.
find . -depth -name '*arkad*' -not -path './.git/*' -not -path '*/node_modules/*' | while read -r p; do
  mv "$p" "$(dirname "$p")/$(basename "$p" | sed "s/arkad/$slug/g")"
done

rm -f ./*.plugin
scripts/build-bundles.sh
echo
echo "Done. Next: README.md → Quick start, from step 2."

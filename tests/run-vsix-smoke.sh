#!/usr/bin/env bash
# Package the extension, check the VSIX contents, install it into an isolated
# extensions directory, and run the hover smoke against the packaged files.
set -euo pipefail

: "${QUAZI_LSP_COMMAND:?set QUAZI_LSP_COMMAND to the qz executable}"
: "${VSCODE_COMMAND:=code}"
: "${VSCE_COMMAND:=npx --yes @vscode/vsce@3.6.0}"

script_dir=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
source_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
work_dir=$(mktemp -d)
trap 'rm -rf -- "$work_dir"' EXIT

# Package a clean copy so local files outside version control and an
# existing node_modules cannot leak into the VSIX.
mkdir "$work_dir/source"
git -C "$source_dir" ls-files -z --cached --others --exclude-standard \
  | (cd "$source_dir" && xargs -0 cp --parents -t "$work_dir/source")
(cd "$work_dir/source" && npm install --omit=dev --no-audit --no-fund --loglevel=error)
(cd "$work_dir/source" && $VSCE_COMMAND package --out "$work_dir/quazi.vsix")

listing=$(unzip -Z1 "$work_dir/quazi.vsix")
for required in extension/package.json extension/src/extension.js \
  extension/syntaxes/quazi.tmLanguage.json extension/language-configuration.json \
  extension/node_modules/vscode-languageclient/node.js; do
  grep -qxF "$required" <<<"$listing" || { printf 'VSIX lacks %s\n' "$required" >&2; exit 1; }
done
if grep -q '^extension/tests/' <<<"$listing"; then
  printf 'VSIX contains test files\n' >&2
  exit 1
fi

mkdir "$work_dir/extensions" "$work_dir/profile"
"$VSCODE_COMMAND" --user-data-dir="$work_dir/profile" \
  --extensions-dir="$work_dir/extensions" \
  --install-extension "$work_dir/quazi.vsix" >/dev/null
installed=$("$VSCODE_COMMAND" --user-data-dir="$work_dir/profile" \
  --extensions-dir="$work_dir/extensions" --list-extensions --show-versions)
version=$(node -p 'require(process.argv[1]).version' "$source_dir/package.json")
grep -qxF "quazilang.quazi@$version" <<<"$installed" \
  || { printf 'quazilang.quazi@%s not installed: %s\n' "$version" "$installed" >&2; exit 1; }

mkdir "$work_dir/unpacked"
unzip -q "$work_dir/quazi.vsix" -d "$work_dir/unpacked"
QUAZI_EXTENSION_DIR="$work_dir/unpacked/extension" bash "$script_dir/run-vscode-hover-smoke.sh" "$@"
printf 'PASS VSIX package and install smoke\n'

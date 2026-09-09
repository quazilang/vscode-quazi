#!/usr/bin/env bash
set -euo pipefail

: "${QUAZI_LSP_COMMAND:?set QUAZI_LSP_COMMAND to the qz executable}"
: "${VSCODE_COMMAND:=code}"

script_dir=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
extension_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
profile_dir=$(mktemp -d)
extensions_dir=$(mktemp -d)

cleanup() {
  rm -rf -- "$profile_dir" "$extensions_dir"
}
trap cleanup EXIT

"$VSCODE_COMMAND" \
  --user-data-dir="$profile_dir" \
  --extensions-dir="$extensions_dir" \
  --extensionDevelopmentPath="$extension_dir" \
  --extensionTestsPath="$script_dir/vscode-hover-smoke.js" \
  --disable-gpu \
  --disable-telemetry \
  --skip-welcome

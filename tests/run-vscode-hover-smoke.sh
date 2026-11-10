#!/usr/bin/env bash
set -euo pipefail

: "${QUAZI_LSP_COMMAND:?set QUAZI_LSP_COMMAND to the qz executable}"
: "${VSCODE_COMMAND:=code}"

script_dir=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
extension_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
profile_dir=$(mktemp -d)
extensions_dir=$(mktemp -d)
result_file=$(mktemp)
log_file=$(mktemp)
rm -f -- "$result_file"
export QUAZI_SMOKE_RESULT="$result_file"

cleanup() {
  rm -rf -- "$profile_dir" "$extensions_dir" "$result_file" "$log_file"
}
trap cleanup EXIT

"$VSCODE_COMMAND" \
  --user-data-dir="$profile_dir" \
  --extensions-dir="$extensions_dir" \
  --extensionDevelopmentPath="$extension_dir" \
  --extensionTestsPath="$script_dir/vscode-hover-smoke.js" \
  --disable-gpu \
  --disable-telemetry \
  --skip-welcome \
  --verbose \
  "$@" > "$log_file" 2>&1 || true

# Without --verbose the launcher detaches and returns before the tests run;
# its status does not reflect the test either way, so success is the marker
# the test writes last. The verbose log is shown only on failure.
if [[ ! -s $result_file ]]; then
  tail -n 40 "$log_file" >&2
  printf 'VS Code hover smoke did not pass\n' >&2
  exit 1
fi
printf 'PASS VS Code hover smoke\n'

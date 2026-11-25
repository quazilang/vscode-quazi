# Quazi for VS Code

Registers `.qz` as `source.quazi`, provides basic TextMate highlighting, and
starts `qz lsp` for language features. Set `quazi.server.path` when `qz` is
not on `PATH`.

## Installation

Package the extension and install the resulting VSIX (VS Code's
**Extensions: Install from VSIX...** command does the same):

```bash
npm install --omit=dev
npx @vscode/vsce package
code --install-extension quazi-0.1.0.vsix
```

The package contains the extension sources, the TextMate grammar and the
runtime `vscode-languageclient` dependency; `.vscodeignore` keeps the tests out.

The server negotiates incremental synchronization (and accepts full-document
replacements). It provides diagnostics, hover, completion, signature help,
formatting, document and workspace symbols, semantic tokens, and type inlay
hints. Definitions and references follow the compiler's configured local,
package, and standard-library import graph. Rename uses the same source map,
but is offered only when every affected file is inside a client-negotiated
workspace root; dependencies and the standard library are never edited.

For the complete feature contract, known limitations, and compiler-level
verification, see the canonical [contained LSP documentation](https://github.com/quazilang/quazistrap/blob/main/docs/tooling/lsp.md).

## Verification

The lifecycle regression check runs without a VS Code installation by mocking
the editor and the language client boundary:

```bash
node tests/extension-lifecycle.test.js
```

For a real-client hover smoke, point the test at a built `qz` executable. It
starts VS Code with isolated user and extension directories, opens a source
file from a temporary Quazi project directory, and requests hover through VS
Code's provider API:

```bash
QUAZI_LSP_COMMAND=/absolute/path/to/qz \
  bash tests/run-vscode-hover-smoke.sh
```

The script reports `PASS VS Code hover smoke` only when the test finished its
checks (the VS Code launcher's own exit status does not reflect the test), and
prints the editor's verbose log otherwise. Extra arguments go to VS Code. To
run it headless, for example with VSCodium and Xvfb from Nix (unset
`WAYLAND_DISPLAY` so Electron uses the virtual X server):

```bash
env -u WAYLAND_DISPLAY -u DISPLAY \
  QUAZI_LSP_COMMAND=/absolute/path/to/qz \
  VSCODE_COMMAND=$(nix build nixpkgs#vscodium --no-link --print-out-paths)/bin/codium \
  $(nix build nixpkgs#xvfb-run --no-link --print-out-paths)/bin/xvfb-run -a \
  bash tests/run-vscode-hover-smoke.sh --ozone-platform=x11
```

To check the package itself, `tests/run-vsix-smoke.sh` packages a clean copy
with `vsce`, verifies the VSIX contents, installs it into an isolated
extensions directory, confirms `quazilang.quazi` is listed with the
`package.json` version, and runs the same hover smoke against the unpacked
VSIX instead of the source checkout. It takes the same environment variables
and arguments (plus `VSCE_COMMAND`, default `npx --yes @vscode/vsce@3.6.0`) and
needs `node`, `npm` and `unzip`. Its success line is
`PASS VSIX package and install smoke`.

# Quazi for VS Code

Registers `.qz` as `source.quazi`, provides basic TextMate highlighting, and
starts `qz lsp` for language features. Install dependencies with `npm install`,
then use VS Code's **Install from VSIX** flow after packaging. Set
`quazi.server.path` when `qz` is not on `PATH`.

The server negotiates incremental synchronization (and accepts full-document
replacements). It provides diagnostics, hover, completion, signature help,
formatting, document and workspace symbols, semantic tokens, and type inlay
hints. Definitions and references follow the compiler's configured local,
package, and standard-library import graph. Rename uses the same source map,
but is offered only when every affected file is inside a client-negotiated
workspace root; dependencies and the standard library are never edited.

For the complete feature contract, known limitations, and compiler-level
verification, see the canonical [contained LSP documentation](../quazistrap/docs/tooling/lsp.md).

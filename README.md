# Quazi for VS Code

Registers `.qz` as `source.quazi`, provides basic TextMate highlighting, and
starts `qz lsp` for language features. Install dependencies with `npm install`,
then use VS Code's **Install from VSIX** flow after packaging. Set
`quazi.server.path` when `qz` is not on `PATH`.

The server uses full-document synchronization and currently provides
same-document semantic navigation; it does not claim workspace-wide features.

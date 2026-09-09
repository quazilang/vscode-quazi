const vscode = require("vscode");
const { LanguageClient } = require("vscode-languageclient/node");

let client;

async function activate() {
  const executable = vscode.workspace.getConfiguration("quazi").get("server.path", "qz");
  client = new LanguageClient(
    "quazi",
    "Quazi Language Server",
    { command: executable, args: ["lsp"] },
    { documentSelector: [{ scheme: "file", language: "quazi" }] },
  );
  await client.start();
}

async function deactivate() {
  const activeClient = client;
  client = undefined;
  await activeClient?.stop();
}

module.exports = { activate, deactivate };

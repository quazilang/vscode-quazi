const vscode = require("vscode");
const { LanguageClient } = require("vscode-languageclient/node");

let client;

function activate(context) {
  const executable = vscode.workspace.getConfiguration("quazi").get("server.path", "qz");
  client = new LanguageClient(
    "quazi",
    "Quazi Language Server",
    { command: executable, args: ["lsp"] },
    { documentSelector: [{ scheme: "file", language: "quazi" }] },
  );
  context.subscriptions.push(client.start());
}

function deactivate() {
  return client?.stop();
}

module.exports = { activate, deactivate };

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const vscode = require("vscode");

const extensionId = "quazilang.quazi";

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function withTimeout(promise, milliseconds, description) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(description)), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function eventually(action, description) {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const value = await action();
      if (value) {
        return value;
      }
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }
  throw new Error(`${description}${lastError ? `: ${lastError.message}` : ""}`);
}

async function createProject() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "quazi-vscode-smoke-"));
  await fs.writeFile(
    path.join(root, "quazi.toml"),
    '[package]\nname = "vscode-smoke"\nversion = "0.1.0"\n',
  );
  const sourcePath = path.join(root, "main.qz");
  await fs.writeFile(sourcePath, "fn main() void {\n    const answer: i32 = 42;\n    ret;\n}\n");
  return { root, sourcePath };
}

exports.run = async function run() {
  const executable = process.env.QUAZI_LSP_COMMAND;
  assert.ok(executable, "set QUAZI_LSP_COMMAND to the qz executable");

  const project = await createProject();
  try {
    await vscode.workspace
      .getConfiguration("quazi")
      .update("server.path", executable, vscode.ConfigurationTarget.Global);

    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension, `development extension '${extensionId}' is unavailable`);
    await extension.activate();

    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(project.sourcePath));
    await vscode.window.showTextDocument(document, { preview: false });
    assert.equal(document.languageId, "quazi");

    const hover = await eventually(
      async () => {
        const results = await withTimeout(
          vscode.commands.executeCommand(
            "vscode.executeHoverProvider",
            document.uri,
            new vscode.Position(1, 24),
          ),
          1_000,
          "VS Code hover-provider request timed out",
        );
        return Array.isArray(results)
          ? results.find((hover) =>
              hover.contents.some(
                (content) => content instanceof vscode.MarkdownString && content.value.includes("i32 = 42"),
              ),
            )
          : undefined;
      },
      "Quazi LSP did not return hover information",
    );
    assert.ok(hover.range, "Quazi hover result has no range");
    assert.ok(
      hover.range.isEqual(new vscode.Range(1, 24, 1, 26)),
      "Quazi hover result does not cover the integer literal",
    );
  } finally {
    await fs.rm(project.root, { recursive: true, force: true });
  }
};

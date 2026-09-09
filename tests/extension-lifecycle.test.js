const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const extensionPath = path.join(__dirname, "..", "src", "extension.js");
const originalLoad = Module._load;
const clients = [];

class FakeLanguageClient {
  constructor(id, name, serverOptions, clientOptions) {
    this.id = id;
    this.name = name;
    this.serverOptions = serverOptions;
    this.clientOptions = clientOptions;
    this.startCalls = 0;
    this.stopCalls = 0;
    clients.push(this);
  }

  async start() {
    this.startCalls += 1;
  }

  async stop() {
    this.stopCalls += 1;
  }
}

async function run() {
  Module._load = function load(request, parent, isMain) {
    if (request === "vscode") {
      return {
        workspace: {
          getConfiguration: () => ({ get: (_key, fallback) => fallback }),
        },
      };
    }
    if (request === "vscode-languageclient/node") {
      return { LanguageClient: FakeLanguageClient };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    delete require.cache[require.resolve(extensionPath)];
    const extension = require(extensionPath);
    await extension.activate();

    assert.equal(clients.length, 1);
    const [client] = clients;
    assert.equal(client.id, "quazi");
    assert.equal(client.serverOptions.command, "qz");
    assert.deepEqual(client.serverOptions.args, ["lsp"]);
    assert.deepEqual(client.clientOptions.documentSelector, [
      { scheme: "file", language: "quazi" },
    ]);
    assert.equal(client.startCalls, 1);

    await extension.deactivate();
    assert.equal(client.stopCalls, 1);
    await extension.deactivate();
    assert.equal(client.stopCalls, 1);
  } finally {
    Module._load = originalLoad;
    delete require.cache[require.resolve(extensionPath)];
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

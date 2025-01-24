const vscode = require("vscode");
const http = require("http");
const WebSocketServer = require("websocket").server;

const server = http.createServer((_, res) => res.writeHead(404).end());
server.listen(33882, () => console.log("WebSocket Server listening on port 33882"));

const wss = new WebSocketServer({ httpServer: server, autoAcceptConnections: false });

let connectedUser = null;
let username = null;

wss.on("request", (request) => {
    if (connectedUser) return request.reject();
    request.requestedProtocols.push("nh");
    const connection = request.accept("nh", request.origin);
    connectedUser = connection;

    setTimeout(() => {
        if (!username) connection.close();
    }, 2500);

    connection.on("message", (message) => {
        if (message.type === "utf8") {
            const [key, ...data] = message.utf8Data.split(":");
            if (key === "auth" && !username) {
                username = data.join(":");
                vscode.window.showInformationMessage(`${username} has connected`);
            } else if (key === "compile_err") {
                vscode.window.showErrorMessage(data.join(":"));
            }
        }
    });

    connection.on("close", () => {
        vscode.window.showInformationMessage(`${username} has disconnected`);
        connectedUser = null;
        username = null;
    });
});
function activate(context) {
    let lastExecutionTime = 0;

    context.subscriptions.push(
        vscode.commands.registerCommand("awpserver.execute", () => {
            const now = Date.now();
            if (now - lastExecutionTime < 1500) {
                return vscode.window.showWarningMessage("Please wait before executing again.");
            }
            lastExecutionTime = now;

            if (!username) return vscode.window.showErrorMessage("No connected client. Make sure to run the script on your executor");
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const document = editor.document;
                const languageId = document.languageId;
                if (languageId !== "lua") {
                    return vscode.window.showErrorMessage("The current file is not a Lua file.");
                }
                connectedUser.sendUTF(document.getText());
                vscode.window.showInformationMessage("Successfully Executed Script");
            }
        })
    );

    const runItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    runItem.command = "awpserver.execute";
    runItem.text = "$(debug-start) Execute Code";
    runItem.tooltip = "Executes the current file on the connected client";
    runItem.show();
    context.subscriptions.push(runItem);

    const config = vscode.workspace.getConfiguration("awpHelper");
    let executeOnSave = config.get("executeOnSave", false);
    console.log(`executeOnSave is set to: ${executeOnSave}`);

    let onSaveDisposable;
    if (executeOnSave) {
        onSaveDisposable = vscode.workspace.onDidSaveTextDocument((document) => {
            console.log("Document saved, executing script...");
            vscode.commands.executeCommand("awpserver.execute");
        });
        context.subscriptions.push(onSaveDisposable);
    }

    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("awpHelper.executeOnSave")) {
            if (onSaveDisposable) {
                onSaveDisposable.dispose();
                onSaveDisposable = undefined;
            }
            const newConfig = vscode.workspace.getConfiguration("awpHelper");
            executeOnSave = newConfig.get("executeOnSave", false);
            console.log(`executeOnSave is set to: ${executeOnSave}`);
            if (executeOnSave) {
                onSaveDisposable = vscode.workspace.onDidSaveTextDocument((document) => {
                    console.log("Document saved, executing script...");
                    vscode.commands.executeCommand("awpserver.execute");
                });
                context.subscriptions.push(onSaveDisposable);
            }
        }
    });
}

function deactivate() {
    if (connectedUser) connectedUser.close();
}

module.exports = { activate, deactivate };
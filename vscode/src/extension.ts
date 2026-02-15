import * as vscode from "vscode";
import { ExtensionMode } from "vscode";
import {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from "./vscode-messages";

function completablePromise<T>(): Promise<T> & {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
} {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  }) as Promise<T> & {
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
  };
  promise.resolve = resolve!;
  promise.reject = reject!;
  return promise;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "calico-colors" is now active!');
  const isProduction = context.extensionMode === ExtensionMode.Production;
  console.log(
    "Extension URI:",
    context.extensionUri,
    "Is production:",
    isProduction,
  );

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      "lofi.editor",
      new LofiEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      },
    ),
  );
}

class LofiDocument implements vscode.CustomDocument {
  constructor(public readonly uri: vscode.Uri) {}

  dispose(): void {
    // Clean up any resources used by the document here
  }
}

class LofiEditorProvider implements vscode.CustomEditorProvider<LofiDocument> {
  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<
    vscode.CustomDocumentContentChangeEvent<LofiDocument>
  >();

  private webview!: vscode.Webview;
  public readonly onDidChangeCustomDocument =
    this._onDidChangeCustomDocument.event;

  constructor(private readonly context: vscode.ExtensionContext) {}

  private sendMessage(message: ExtensionToWebviewMessage) {
    this.webview.postMessage(message);
  }

  private eventHandlers: {
    [key in WebviewToExtensionMessage["type"]]?: (
      message: Extract<WebviewToExtensionMessage, { type: key }>,
    ) => void;
  } = {};

  saveCustomDocument(
    document: LofiDocument,
    cancellation: vscode.CancellationToken,
  ): Thenable<void> {
    console.log("Saving document:", document.uri.toString());
    const promise = completablePromise<void>();
    cancellation.onCancellationRequested(() => {
      this.eventHandlers.exportProjectResponse = undefined;
      promise.reject(new Error("Save cancelled"));
    });
    this.eventHandlers.exportProjectResponse = (message) => {
      console.log("Received save response");
      this.eventHandlers.exportProjectResponse = undefined;
      if (cancellation.isCancellationRequested) {
        return;
      }
      vscode.workspace.fs.writeFile(
        document.uri,
        Buffer.from(message.fileContent, "base64"),
      );
      promise.resolve();
    };
    this.sendMessage({
      type: "exportProject",
    });
    return promise;
  }

  async saveCustomDocumentAs(
    _document: LofiDocument,
    destination: vscode.Uri,
    cancellation: vscode.CancellationToken,
  ) {
    const promise = completablePromise<void>();
    cancellation.onCancellationRequested(() => {
      this.eventHandlers.exportProjectResponse = undefined;
      promise.reject(new Error("Save cancelled"));
    });

    this.eventHandlers.exportProjectResponse = (message) => {
      this.eventHandlers.exportProjectResponse = undefined;
      if (cancellation.isCancellationRequested) {
        return;
      }
      vscode.workspace.fs.writeFile(
        destination,
        Buffer.from(message.fileContent, "base64"),
      );
      promise.resolve();
    };
    this.sendMessage({
      type: "exportProject",
    });
    return promise;
  }
  async revertCustomDocument(
    document: LofiDocument,
    _cancellation: vscode.CancellationToken,
  ): Promise<void> {
    const data = await vscode.workspace.fs.readFile(document.uri);
    const base64Data = Buffer.from(data).toString("base64");
    this.sendMessage({
      type: "loadDocument",
      value: base64Data,
    });
  }
  backupCustomDocument(
    document: LofiDocument,
    context: vscode.CustomDocumentBackupContext,
    cancellation: vscode.CancellationToken,
  ): Thenable<vscode.CustomDocumentBackup> {
    console.log("Backing up document:", document.uri.toString());
    const promise = completablePromise<vscode.CustomDocumentBackup>();
    cancellation.onCancellationRequested(() => {
      this.eventHandlers.exportProjectResponse = undefined;
      promise.reject(new Error("Save cancelled"));
    });

    this.eventHandlers.exportProjectResponse = (message) => {
      this.eventHandlers.exportProjectResponse = undefined;
      if (cancellation.isCancellationRequested) {
        return;
      }
      vscode.workspace.fs.createDirectory(
        vscode.Uri.joinPath(context.destination, ".."),
      );
      vscode.workspace.fs.writeFile(
        context.destination,
        Buffer.from(message.fileContent, "base64"),
      );
      promise.resolve({
        id: context.destination.toString(),
        delete: async () => {
          try {
            await vscode.workspace.fs.delete(context.destination);
          } catch {
            // noop
          }
        },
      });
    };
    this.sendMessage({
      type: "exportProject",
    });
    return promise;
  }

  openCustomDocument(
    uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
    token: vscode.CancellationToken,
  ): LofiDocument | Thenable<LofiDocument> {
    let data: Uint8Array;
    this.eventHandlers.listening = async () => {
      if (openContext.backupId) {
        console.log("loading from backup");
        const backupUri = vscode.Uri.parse(openContext.backupId);
        data = await vscode.workspace.fs.readFile(backupUri);
      } else if (openContext.untitledDocumentData) {
        data = openContext.untitledDocumentData;
      } else {
        data = await vscode.workspace.fs.readFile(uri);
      }
      const base64Data = Buffer.from(data).toString("base64");
      this.sendMessage({
        type: "loadDocument",
        value: base64Data,
      });
    };
    return new LofiDocument(uri);
  }
  async resolveCustomEditor(
    document: LofiDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken,
  ) {
    this.webview = webviewPanel.webview;
    webviewPanel.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewPanel.webview.html = await this._getHtmlForWebview(
      webviewPanel.webview,
    );

    webviewPanel.webview.onDidReceiveMessage(
      async (data: WebviewToExtensionMessage) => {
        console.log("Received message from webview:", data.type ?? data);
        switch (data.type) {
          case "triggerSave":
            {
              vscode.workspace.save(document.uri);
            }
            break;
          case "projectChanged":
            {
              this._onDidChangeCustomDocument.fire({
                document,
              });
            }
            break;
          default: {
            const handler = this.eventHandlers[data.type] as any;
            if (handler) {
              handler(data);
            }
          }
        }
      },
    );
  }

  private async _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    if (process.env.NODE_ENV !== "production") {
      // load dist/webview/index.html in production
      const indexHtmlContent = (
        await vscode.workspace.fs.readFile(
          vscode.Uri.joinPath(
            this.context.extensionUri,
            // "dist",
            "webview",
            "index.html",
          ),
        )
      )
        .toString()
        .replace(
          "<head>",
          `<head>\n<base href="${webview.asWebviewUri(
            vscode.Uri.joinPath(
              this.context.extensionUri,
              //"dist",
              "webview",
            ),
          )}/"><script>console.log("Acquiring vscode"); try {vscode = acquireVsCodeApi();} catch (error) {console.error("Failed to acquire vscode:", error);}</script>`,
        );
      console.log("Loaded index.html ", indexHtmlContent.toString());
      return indexHtmlContent.toString();
    }

    const url = "http://localhost:5177";

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Cat Colors</title>
        <style>
          	html, body {
            height: 100%;
            }
        </style>
			</head>
			<body>
        <iframe id="lofiWebview" src="${url}" width="100%" height="100%"></iframe>
				<script>
          const vscode = acquireVsCodeApi();
          const iframe = document.getElementById("lofiWebview");
          iframe.addEventListener("load", () => {
            window.addEventListener("message", (event) => {
              console.log("Parent received message:", event.origin);
              if (event.origin === "${url}") {
                vscode.postMessage(event.data);
              }
              else {
                iframe.contentWindow.postMessage(event.data, "*");
              } 
            });
          });
        </script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

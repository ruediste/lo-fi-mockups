export type WebviewToExtensionMessage =
  | {
      type:
        | "listening"
        | "projectChanged"
        // save is triggered from the webview
        | "triggerSave";
    }
  | {
      type: "exportProjectResponse";
      fileContent: string;
    };

export type ExtensionToWebviewMessage =
  | {
      type: "loadDocument";
      value: string;
    }
  | {
      // causes a saveResponse message to be sent back with the file content
      type: "exportProject";
    };

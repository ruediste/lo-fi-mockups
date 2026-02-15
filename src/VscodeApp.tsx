import { saveAs } from "file-saver";
import { useEffect, useRef } from "react";
import {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from "../vscode/src/vscode-messages";
import { useEditorState } from "./editor/EditorState";
import { LofiFileType } from "./editor/repository";
import { InnerApp } from "./InnerApp";
import { useEvent } from "./util/hooks";

let sendMessage: (message: WebviewToExtensionMessage) => void;
if (import.meta.env.MODE === "production") {
  console.log("Running in production mode");
  // ts-ignore because acquireVsCodeApi is injected by vscode and not defined in the global scope
  // @ts-ignore
  sendMessage = (msg) => vscode.postMessage(msg);
} else {
  console.log("Running in development mode");
  sendMessage = (msg) => window.parent.postMessage(msg, "*");
}

declare global {
  interface UInt8ArrayConstructor {
    fromBase64(base64: string): Uint8Array;
  }
  interface Uint8Array {
    toBase64(): string;
  }
}

export function VscodeApp() {
  const editorState = useEditorState();
  const type = useRef<LofiFileType | undefined>(undefined);
  useEvent(editorState.onProjectChanged, () => {
    sendMessage({ type: "projectChanged" });
  });
  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        sendMessage({ type: "triggerSave" });
      }
    });
    window.addEventListener("message", async (event) => {
      const data = event.data as ExtensionToWebviewMessage;
      console.log("Received message from extension:", data.type ?? data);
      switch (data.type) {
        case "loadDocument": {
          if (1 == 1) return;
          // convert base64 to binary
          console.log("Loading document...");
          try {
            const binaryData = (Uint8Array as any).fromBase64(data.value);
            type.current = await editorState.repository.loadProject(
              new Blob([binaryData]),
              false,
            );
            console.log("Document loaded with type:", type.current);
          } catch (error) {
            console.error("Failed to load document:", error);
          } finally {
            console.log("Load document process completed.");
          }
          break;
        }
        case "exportProject": {
          switch (type.current) {
            case "lofi": {
              const data = await editorState.repository.createZip(true);
              sendMessage({
                type: "exportProjectResponse",
                fileContent: new Uint8Array(
                  await data.arrayBuffer(),
                ).toBase64(),
              });
              break;
            }
            case "png": {
              const data = await editorState.repository.createLofiPng();
              sendMessage({
                type: "exportProjectResponse",
                fileContent: new Uint8Array(
                  await data.arrayBuffer(),
                ).toBase64(),
              });
              break;
            }
            default:
              console.error("Unknown file type:", type.current);
          }
          break;
        }
      }
    });
    sendMessage({
      type: "listening",
    });
  }, []);
  console.log("Rendering VscodeApp");
  return (
    <InnerApp
      controls={{
        saveAs: (data, filename) => saveAs(data, filename),
        hideUploadDownload: true,
        projectName: "project",
      }}
    />
  );
}

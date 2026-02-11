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

function sendMessage(message: WebviewToExtensionMessage) {
  window.parent.postMessage(message, "*");
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
      console.log("Received message from webview:", data.type);
      switch (data.type) {
        case "loadDocument": {
          // convert base64 to binary
          const binaryData = (Uint8Array as any).fromBase64(data.value);
          type.current = await editorState.repository.loadProject(
            new Blob([binaryData]),
            false,
          );
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

import { editorState, useEditorState } from "@/editor/EditorState";
import { InnerApp } from "@/InnerApp";
import { filesystem, os } from "@neutralinojs/lib";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";

function getFileNameFromPath(path: string): string {
  return path.split("/").slice(-1)[0];
}
function getBaseFileNameFromPath(path: string): string {
  return getFileNameFromPath(path).split(".").slice(0, -1).join(".");
}

function changeFileExtension(path: string, newExt: string): string {
  return path.split(".").slice(0, -1).join(".") + "." + newExt;
}

function getDirectoryFromPath(path: string): string {
  return path.split("/").slice(0, -1).join("/");
}

let initialized = false;

async function loadInitialFile(name: string, loaded: () => void) {
  try {
    const fileData = await filesystem.readBinaryFile(name);
    const state = await editorState;
    await state.repository.loadZip(new Blob([fileData]), false);
    loaded();
  } catch (e) {
    console.error("Error loading initial file:", e);
  }
}

export function NativeApp() {
  const state = useEditorState();
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  useEffect(() => {
    if (initialized) return;
    initialized = true;
    if (window.NL_ARGS) {
      // find first argument not starting with -
      const fileArg = window.NL_ARGS.find(
        (arg, idx) => idx > 0 && !arg.startsWith("-"),
      );
      if (fileArg) {
        loadInitialFile(fileArg, () => setCurrentFile(fileArg));
      }
    }
  }, []);

  return (
    <InnerApp
      controls={{
        projectName: currentFile
          ? getBaseFileNameFromPath(currentFile)
          : "Untitled",
        saveAs: (data, filename, title) => {
          (async () => {
            const result = await os.showSaveDialog(title, {
              defaultPath:
                currentFile === null
                  ? undefined
                  : getDirectoryFromPath(currentFile) + "/",
            });
            if (result) {
              await filesystem.writeBinaryFile(
                result,
                await data.arrayBuffer(),
              );
              toast.success(`File saved: ${getFileNameFromPath(result)}`);
            }
          })();
        },
        hideUploadDownload: true,
        rightControls: (args) => (
          <>
            <Button
              onClick={async () => {
                const result = await os.showOpenDialog("Open LoFi Mockup", {
                  filters: [{ name: "LoFi Mockup", extensions: ["lofi"] }],
                });
                if (result.length == 1) {
                  // Handle the selected file here
                  const fileData = await filesystem.readBinaryFile(result[0]);
                  state.repository.loadZip(new Blob([fileData]), false);
                  setCurrentFile(result[0]);
                }
              }}
            >
              Open...
            </Button>
            {currentFile && (
              <Button
                onClick={async () => {
                  const data = await args.createZip(false);
                  await filesystem.writeBinaryFile(
                    currentFile,
                    await data.arrayBuffer(),
                  );
                  toast.success(
                    `File saved: ${getFileNameFromPath(currentFile)}`,
                  );
                }}
              >
                Save {getFileNameFromPath(currentFile)}
              </Button>
            )}
            <Button
              onClick={async () => {
                const result = await os.showSaveDialog("Save LoFi Mockup", {
                  filters: [{ name: "LoFi Mockup", extensions: ["lofi"] }],
                  defaultPath: currentFile ?? "project.lofi",
                });
                if (result) {
                  const data = await args.createZip(false);
                  await filesystem.writeBinaryFile(
                    result,
                    await data.arrayBuffer(),
                  );
                  setCurrentFile(result);
                  toast.success(`File saved: ${getFileNameFromPath(result)}`);
                }
              }}
            >
              Save As ...
            </Button>
          </>
        ),
        hideExports: true,
        topMenuItems: (args) => [
          args.exportPdf(),
          currentFile != null && {
            label: "Export as " + getBaseFileNameFromPath(currentFile) + ".pdf",
            onClick: async () => {
              if (args.pdfInProgress) return;
              var pdf = await args.createPdf();
              await filesystem.writeBinaryFile(
                changeFileExtension(currentFile, "pdf"),
                await pdf.arrayBuffer(),
              );
              toast.success(
                `File saved: ${getBaseFileNameFromPath(currentFile) + ".pdf"}`,
              );
            },
          },
          args.exportPng(),
          currentFile != null && {
            label: "Export as " + getBaseFileNameFromPath(currentFile) + ".png",
            onClick: async () => {
              var png = await args.createPng();
              await filesystem.writeBinaryFile(
                changeFileExtension(currentFile, "png"),
                await png.arrayBuffer(),
              );
              toast.success(
                `File saved: ${getBaseFileNameFromPath(currentFile) + ".png"}`,
              );
            },
          },
        ],
      }}
    />
  );
}

import { editorState, useEditorState } from "@/editor/EditorState";
import { InnerApp } from "@/InnerApp";
import { filesystem, os } from "@neutralinojs/lib";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";

function getFileNameFromPath(path: string): string {
  return path.split("/").slice(-1)[0];
}

function removeFileExtension(fileName: string): string {
  return fileName.split(".").slice(0, -1).join(".");
}

function getBaseFileNameFromPath(path: string): string {
  return removeFileExtension(getFileNameFromPath(path));
}

function changeFileExtension(path: string, newExt: string): string {
  return removeFileExtension(path) + "." + newExt;
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
  const [currentFile, setCurrentFile] = useState<{
    directory: string;
    fullFilePath: string;
    fileName: string;
    baseFileName: string;
    type: "zip" | "png";
  } | null>(null);

  useEffect(() => {
    if (initialized) return;
    initialized = true;
    if (window.NL_ARGS) {
      // find first argument not starting with -
      const fileArg = window.NL_ARGS.find(
        (arg, idx) => idx > 0 && !arg.startsWith("-"),
      );
      if (fileArg) {
        loadInitialFile(fileArg, () => setCurrentFile(toCurrentFile(fileArg)));
      }
    }
  }, []);

  const toCurrentFile = (fullFilePath: string) =>
    ({
      fullFilePath,
      directory: getDirectoryFromPath(fullFilePath),
      fileName: getFileNameFromPath(fullFilePath),
      baseFileName: removeFileExtension(getFileNameFromPath(fullFilePath)),
      type: fullFilePath.endsWith(".lofi.png") ? "png" : "zip",
    }) as const;

  return (
    <InnerApp
      controls={{
        projectName: currentFile ? currentFile.baseFileName : "Untitled",
        saveAs: (data, filename, title) => {
          (async () => {
            const result = await os.showSaveDialog(title, {
              defaultPath:
                currentFile === null
                  ? undefined
                  : currentFile.directory + "/" + filename,
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
                  filters: [
                    { name: "LoFi Mockup", extensions: ["lofi", "lofi.png"] },
                  ],
                });
                if (result.length == 1) {
                  // Handle the selected file here
                  const fullFilePath = result[0];
                  const fileData =
                    await filesystem.readBinaryFile(fullFilePath);
                  state.repository.loadZip(new Blob([fileData]), false);

                  const fileName = getFileNameFromPath(fullFilePath);
                  const type = fullFilePath.endsWith(".lofi.png")
                    ? "png"
                    : "zip";
                  setCurrentFile(toCurrentFile(fullFilePath));
                }
              }}
            >
              Open...
            </Button>
            {currentFile && (
              <Button
                onClick={async () => {
                  const data =
                    currentFile.type === "png"
                      ? await args.createPng()
                      : await args.createZip(false);
                  await filesystem.writeBinaryFile(
                    currentFile.fullFilePath,
                    await data.arrayBuffer(),
                  );
                  toast.success(`File saved: ${currentFile.fileName}`);
                }}
              >
                Save {currentFile.fileName}
              </Button>
            )}
            <Button
              onClick={async () => {
                const result = await os.showSaveDialog("Save LoFi Mockup", {
                  filters: [{ name: "LoFi Mockup", extensions: ["lofi"] }],
                  defaultPath: currentFile?.fullFilePath ?? "project.lofi",
                });
                if (result) {
                  const data = await args.createZip(false);
                  await filesystem.writeBinaryFile(
                    result,
                    await data.arrayBuffer(),
                  );
                  setCurrentFile({
                    fullFilePath: result,
                    directory: getDirectoryFromPath(result),
                    fileName: getFileNameFromPath(result),
                    baseFileName: removeFileExtension(
                      getFileNameFromPath(result),
                    ),
                    type: "zip",
                  });
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
            label: "Export as " + currentFile.baseFileName + ".pdf",
            onClick: async () => {
              if (args.pdfInProgress) return;
              var pdf = await args.createPdf();
              await filesystem.writeBinaryFile(
                currentFile.directory + "/" + currentFile.baseFileName + ".pdf",
                await pdf.arrayBuffer(),
              );
              toast.success(`File saved: ${currentFile.baseFileName + ".pdf"}`);
            },
          },
          args.exportPng(),
          currentFile != null && {
            label: "Export as " + currentFile.baseFileName + ".png",
            onClick: async () => {
              var png = await args.createPng();
              await filesystem.writeBinaryFile(
                currentFile.directory + "/" + currentFile.baseFileName + ".png",
                await png.arrayBuffer(),
              );
              toast.success(`File saved: ${currentFile.baseFileName + ".png"}`);
            },
          },
          args.exportLofiPng(),
          currentFile != null && {
            label: "Export as " + currentFile.baseFileName + ".lofi.png",
            onClick: async () => {
              var png = await args.createLofiPng();
              await filesystem.writeBinaryFile(
                currentFile.directory +
                  "/" +
                  currentFile.baseFileName +
                  ".lofi.png",
                await png.arrayBuffer(),
              );
              toast.success(
                `File saved: ${currentFile.baseFileName + ".lofi.png"}`,
              );
            },
          },
        ],
      }}
    />
  );
}

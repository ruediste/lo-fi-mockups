import { editorState, useEditorState } from "@/editor/EditorState";
import { LofiFileType } from "@/editor/repository";
import { InnerApp } from "@/InnerApp";
import { filesystem, os } from "@neutralinojs/lib";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";

function getFileNameFromPath(path: string): string {
  return path.split("/").slice(-1)[0];
}

function removeFileExtension(fileName: string): string {
  if (fileName.endsWith(".lofi.png")) {
    return fileName.slice(0, -".lofi.png".length);
  }
  const parts = fileName.split(".");
  // If there is only one part, return the original fileName
  if (parts.length === 1) return fileName;
  return parts.slice(0, -1).join(".");
}

function getDirectoryFromPath(path: string): string {
  return path.split("/").slice(0, -1).join("/");
}

let initialized = false;

async function loadInitialFile(
  name: string,
  loaded: (fileType: LofiFileType) => void,
) {
  try {
    const fileData = await filesystem.readBinaryFile(name);
    const state = await editorState;
    const fileType = await state.repository.loadProject(
      new Blob([fileData]),
      false,
    );
    loaded(fileType);
  } catch (e) {
    toast.error(
      "Error loading " +
        getFileNameFromPath(name) +
        ": " +
        (e instanceof Error ? e.message : String(e)),
    );
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
    type: LofiFileType;
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
        loadInitialFile(fileArg, (type) =>
          setCurrentFile(toCurrentFile(fileArg, type)),
        );
      }
    }
  }, []);

  const toCurrentFile = (fullFilePath: string, type: LofiFileType) => {
    const fileName = getFileNameFromPath(fullFilePath);
    return {
      fullFilePath,
      directory: getDirectoryFromPath(fullFilePath),
      fileName: fileName,
      baseFileName: removeFileExtension(fileName),
      type,
    } as const;
  };

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
                  try {
                    const type = await state.repository.loadProject(
                      new Blob([fileData]),
                      false,
                    );

                    setCurrentFile(toCurrentFile(fullFilePath, type));
                  } catch (e) {
                    toast.error(
                      "Error loading " +
                        getFileNameFromPath(fullFilePath) +
                        ": " +
                        (e instanceof Error ? e.message : String(e)),
                    );
                    console.error("Error loading file:", e);
                  }
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
                      ? await args.createLofiPng()
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
                  filters: [
                    { name: "LoFi Mockup", extensions: ["lofi"] },
                    { name: "LoFi Mockup PNG", extensions: ["lofi.png"] },
                  ],
                  defaultPath: currentFile?.fullFilePath ?? "project.lofi",
                });
                if (result) {
                  const type = result.endsWith(".lofi.png") ? "png" : "lofi";
                  const data =
                    type === "png"
                      ? await args.createLofiPng()
                      : await args.createZip(false);
                  await filesystem.writeBinaryFile(
                    result,
                    await data.arrayBuffer(),
                  );
                  setCurrentFile(toCurrentFile(result, type));
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

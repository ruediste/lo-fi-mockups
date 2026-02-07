import { useState } from "react";

import useSearchHref from "@/util/useSearchHref";
import "@/widgets/PageItemTypeRegistry";
import { Button, Stack } from "react-bootstrap";
import Dropzone from "react-dropzone";
import { toast } from "react-toastify";

import { confirm } from "@/util/confirm";
import { ThreeDotMenu, ThreeDotMenuItem } from "@/util/Inputs";
import "rc-dock/dist/rc-dock.css";
import { useEditorState } from "./EditorState";

export interface ControlsArgs {
  createZip: (includeImages: boolean) => Promise<Blob>;
  createPdf: () => Promise<Blob>;
  createPng: () => Promise<Blob>;
  createLofiPng: () => Promise<Blob>;
  inProgress: boolean;
  pdfInProgress: boolean;
  zipInProgress: boolean;
  exportPdf: () => ThreeDotMenuItem;
  exportPng: () => ThreeDotMenuItem;
  exportLofiPng: () => ThreeDotMenuItem;
}

export interface EditorControlsProps {
  projectName: string;
  rightControls?: (args: ControlsArgs) => React.ReactNode;
  resetLayout: () => void;
  saveAs: (data: Blob, filename: string, title: string) => void;
  hideUploadDownload?: boolean;
  hideExports?: boolean;
  topMenuItems?: (
    args: ControlsArgs,
  ) => (ThreeDotMenuItem | false | null | undefined)[];
}

export function EditorControls({
  projectName,
  resetLayout,
  saveAs,
  hideUploadDownload,
  hideExports,
  topMenuItems,
  rightControls,
}: EditorControlsProps) {
  const state = useEditorState();
  const play = useSearchHref({ pathname: "./play" });

  const [zipProgress, setZipProgress] = useState<
    { processed: number; total: number } | undefined
  >(undefined);

  const [pdfProgress, setPdfProgress] = useState<
    { processed: number; total: number } | undefined
  >(undefined);

  const args: ControlsArgs = {
    createZip: async (includeImages: boolean) => {
      try {
        return await state.repository.createZip(
          includeImages,
          (processed, total) => {
            setZipProgress({ processed, total });
          },
        );
      } finally {
        setZipProgress(undefined);
      }
    },
    createPdf: async () => {
      try {
        return await state.repository.createPdf((processed, total) => {
          setPdfProgress({ processed, total });
        });
      } finally {
        setPdfProgress(undefined);
      }
    },
    createPng: async () => {
      return await state.repository.createPng();
    },
    createLofiPng: async () => {
      return await state.repository.createLofiPng();
    },
    inProgress: zipProgress !== undefined || pdfProgress !== undefined,
    pdfInProgress: pdfProgress !== undefined,
    zipInProgress: zipProgress !== undefined,
    exportPdf: () => ({
      label: "Export PDF",
      onClick: async () => {
        if (args.pdfInProgress) return;
        var pdf = await args.createPdf();
        saveAs(pdf, projectName + ".pdf", "Save PDF");
      },
    }),
    exportPng: () => ({
      label: "Export PNG Image",
      onClick: async () => {
        saveAs(await args.createPng(), projectName + ".png", "Save PNG");
      },
    }),
    exportLofiPng: () => ({
      label: "Export LoFi PNG Image",
      onClick: async () => {
        saveAs(
          await args.createLofiPng(),
          projectName + ".lofi.png",
          "Save LoFi PNG",
        );
      },
    }),
  };

  return (
    <Stack direction="horizontal" style={{ marginLeft: "auto" }} gap={3}>
      <Button as="a" {...play}>
        Play
      </Button>
      {pdfProgress && (
        <span>
          Creating PDF: {pdfProgress.processed}/{pdfProgress.total}
        </span>
      )}
      {zipProgress && (
        <span>
          Creating Download: {zipProgress.processed}/{zipProgress.total}
        </span>
      )}
      {!hideUploadDownload && (
        <>
          {!zipProgress && (
            <Button
              onClick={async () => {
                state.repository.projectData.dataVersion++;
                state.project.onDataChanged();
                saveAs(
                  await args.createZip(false),
                  projectName + ".lofi",
                  "Save LoFi Mockup",
                );
                setZipProgress(undefined);
              }}
            >
              Download
            </Button>
          )}
          <Dropzone
            onDropAccepted={async (acceptedFiles) => {
              if (acceptedFiles.length < 1) {
                return;
              }
              if (acceptedFiles.length > 1) {
                toast.error("Multiple Files Dropped");
                return;
              }
              if (
                !acceptedFiles[0].name.endsWith(".lofi") &&
                !acceptedFiles[0].name.endsWith(".lofi.png")
              ) {
                toast.error("File has to end in '.lofi' or '.lofi.png'");
                return;
              }
              try {
                await state.repository.loadZip(acceptedFiles[0], false);
              } catch (e) {
                console.log(e);
                toast.error("Loading " + acceptedFiles[0].name + " failed");
              }
              toast.success("File " + acceptedFiles[0].name + " loaded");
            }}
          >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div
                {...getRootProps()}
                style={{
                  margin: "-4px",
                  padding: "4px",
                  ...(isDragActive
                    ? {
                        border: "1px dashed black",
                      }
                    : { border: "1px dashed transparent" }),
                }}
              >
                <input {...getInputProps()} />
                <Button>Upload</Button>
              </div>
            )}
          </Dropzone>
        </>
      )}
      {rightControls?.(args)}
      <ThreeDotMenu
        items={[
          ...(topMenuItems
            ? topMenuItems(args).filter(
                (x) => typeof x !== "boolean" && x != null,
              )
            : []),
          ...(!hideExports
            ? [args.exportPdf(), args.exportPng(), args.exportLofiPng()]
            : []),
          {
            label: "Copy Image to Clipboard",
            onClick: async () => {
              const blob = await args.createPng();
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
              ]);
              toast.success("Image copied to the clipboard");
            },
          },
          {
            label: "Clear Project",
            onClick: async () => {
              if (
                await confirm({
                  title: "Clear Project",
                  confirmation: "Really clear the project?",
                  okDangerous: true,
                  okLabel: "Clear",
                })
              )
                state.repository.clear();
            },
          },
          {
            label: "Reset Editor Layout",
            onClick: async () => {
              if (
                await confirm({
                  title: "Reset Editor Layout",
                  confirmation:
                    "Really set the editor layout back to the default?",
                  okDangerous: true,
                  okLabel: "Reset",
                })
              ) {
                resetLayout();
              }
            },
          },
          {
            label: "Help",
            href: "https://github.com/ruediste/lo-fi-mockups/blob/main/README.md",
          },
        ]}
      />
    </Stack>
  );
}

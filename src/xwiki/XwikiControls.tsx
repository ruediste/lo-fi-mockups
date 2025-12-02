import { useEditorState } from "@/editor/EditorState";
import { fetchData } from "@/util/fetchData";
import { Button } from "react-bootstrap";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "react-toastify";
import { saveLoFiIdentification, xwiki } from "./xwikiUtils";

export function XwikiControls() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useEditorState();
  const attachment = searchParams.get("attachment")!;
  const page = searchParams.get("page")!;
  const [saveProgress, setSaveProgress] = useState<
    { processed: number; total: number } | undefined
  >(undefined);

  const save = async () => {
    state.repository.projectData.dataVersion++;
    state.project.onDataChanged();
    const zip = await state.repository.createZip(true, (processed, total) => {
      setSaveProgress({ processed, total });
    });
    try {
      await fetchData(
        xwiki({
          url: page + "/attachments/" + attachment,
          data: zip,
          method: "PUT",
        })
      );
      saveLoFiIdentification(page, attachment);
      setSaveProgress(undefined);
      toast.success("Project saved to XWiki");
    } catch (e) {
      setSaveProgress(undefined);
      toast.error(
        "Failed save project to XWiki. Login to Xwiki in a separate tab and try again."
      );
      throw e;
    }
  };
  if (page == null || attachment == null) return null;
  return (
    <>
      {saveProgress && (
        <span>
          Saving to XWiki: {saveProgress.processed}/{saveProgress.total}
        </span>
      )}
      {!saveProgress && <Button onClick={save}>Save</Button>}
      {!saveProgress && (
        <Button
          onClick={async () => {
            await save();
            history.back();
          }}
        >
          Save & Close
        </Button>
      )}
    </>
  );
}

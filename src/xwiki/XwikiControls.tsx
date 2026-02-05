import { ControlsArgs } from "@/editor/EditorControls";
import { useEditorState } from "@/editor/EditorState";
import { fetchData } from "@/util/fetchData";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { saveLoFiIdentification, xwiki } from "./xwikiUtils";

export function XwikiControls({
  page,
  attachment,
  args,
}: {
  page: string;
  attachment: string;
  args: ControlsArgs;
}) {
  const state = useEditorState();

  const save = async () => {
    state.repository.projectData.dataVersion++;
    state.project.onDataChanged();
    const zip = await args.createZip(true);
    try {
      await fetchData(
        xwiki({
          url: page + "/attachments/" + attachment,
          data: zip,
          method: "PUT",
        }),
      );
      saveLoFiIdentification(page, attachment);
      toast.success("Project saved to XWiki");
    } catch (e) {
      toast.error(
        "Failed save project to XWiki. Login to Xwiki in a separate tab and try again.",
      );
      throw e;
    }
  };
  return (
    <>
      {!args.zipInProgress && <Button onClick={save}>Save</Button>}
      {!args.zipInProgress && (
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

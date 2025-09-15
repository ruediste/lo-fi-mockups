import { useEditorState } from "@/editor/EditorState";
import { fetchData } from "@/util/fetchData";
import { Button } from "react-bootstrap";
import { useSearchParams } from "react-router";
import { toast } from "react-toastify";
import { xwiki } from "./xwikiUtils";

export function XwikiControls() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useEditorState();
  const attachment = searchParams.get("attachment");
  const page = searchParams.get("page");
  const save = async () => {
    const zip = await state.repository.createZip();
    try {
      await fetchData(
        xwiki({
          url: page + "/attachments/" + attachment,
          data: zip,
          method: "PUT",
        })
      );
      toast.success("Project saved to XWiki");
    } catch (e) {
      toast.error(
        "Failed save project to XWiki. Login to Xwiki in a separate tab and try again."
      );
      throw e;
    }
  };
  if (page == null || attachment == null) return null;
  return (
    <>
      <Button onClick={save}>Save</Button>
      <Button
        onClick={async () => {
          await save();
          history.back();
        }}
      >
        Save & Close
      </Button>
    </>
  );
}

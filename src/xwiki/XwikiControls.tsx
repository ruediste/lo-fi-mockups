import { repository } from "@/repository";
import { fetchData } from "@/util/fetchData";
import { Button } from "react-bootstrap";
import { useSearchParams } from "react-router";
import { xwiki } from "./xwikiUtils";

export function XwikiControls() {
  const [searchParams, setSearchParams] = useSearchParams();
  const attachment = searchParams.get("attachment");
  const page = searchParams.get("page");
  const save = async () => {
    const repo = await repository;
    const zip = await repo.createZip();
    fetchData(
      xwiki({
        url: page + "/attachments/" + attachment,
        data: zip,
        method: "PUT",
      })
    );
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

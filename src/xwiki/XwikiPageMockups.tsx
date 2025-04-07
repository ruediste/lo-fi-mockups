import { InnerApp } from "@/App";
import useSearchHref from "@/util/useSearchHref";
import { useState } from "react";
import {
  Alert,
  Button,
  CloseButton,
  Form,
  ListGroup,
  Stack,
} from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { useSearchParams } from "react-router";
import { repository } from "../repository";
import { confirm } from "../util/confirm";
import { fetchData, fetchDataRaw, useLoader } from "../util/fetchData";
import { WithLoader, WithMultiData } from "../util/UseData";
import { xwiki } from "./xwikiUtils";

// http://localhost:8078/webjars/wiki%3Axwiki/lo-fi-mockups-webjar/1.0.23-SNAPSHOT/index.html?page=wikis%2Fxwiki%2Fspaces%2Ftest2%2Fspaces%2FLoFiTest%2Fpages%2FWebHome
// http: //localhost:8078/webjars/wiki%3Axwiki/lo-fi-mockups-webjar/1.0.1-SNAPSHOT/index.html
// http://localhost:5173/#xwiki/?page=wikis/xwiki%2Fspaces%2Ftest2%2Fspaces%2FLoFiTest%2Fpages%2FWebHome
// http://localhost:5173/#xwiki/?attachment=df.zip&page=wikis/xwiki/spaces/test2/spaces/LoFiTest/pages/WebHome

interface XwikiAttachments {
  attachments: {
    name: string;
    hierarchy: { items: { name: string; type: string }[] };
  }[];
}

export function MockupListItem({
  name,
  page,
  refresh,
}: {
  name: string;
  page: string;
  refresh: () => void;
}) {
  const href = useSearchHref({ search: { attachment: name } });

  return (
    <ListGroup.Item action {...href}>
      <Stack direction="horizontal">
        <span>
          {name.endsWith(".lofi") ? name.substring(0, name.length - 5) : name}
        </span>
        <Button
          style={{ marginLeft: "auto" }}
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (
              await confirm({
                title: "Delete " + name,
                confirmation: "Are you sure?",
                okDangerous: true,
              })
            ) {
              await fetchData(
                xwiki({ url: page + "/attachments/" + name, method: "DELETE" })
              );
              refresh();
            }
          }}
        >
          <Trash />
          Delete
        </Button>
      </Stack>
    </ListGroup.Item>
  );
}

export function XwikiPageMockupsIndex({ page }: { page: string }) {
  const [newMockupName, setNewMockupName] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <WithMultiData<[{ title: string }, XwikiAttachments]>
      args={[
        xwiki({
          url: page,
        }),
        xwiki({
          url: page + "/attachments/",
        }),
      ]}
    >
      {([pageData, attachmentsRaw], refresh) => {
        const attachments = attachmentsRaw.attachments.filter((x) =>
          x.name.endsWith(".lofi")
        );
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <Stack direction="horizontal">
                <span>LoFi Mockups in </span>
                {document.referrer != "" && (
                  <CloseButton
                    style={{ marginLeft: "auto" }}
                    onClick={() => history.back()}
                  />
                )}
              </Stack>
              <h1> {pageData.title}</h1>
              {attachments.length == 0 ? (
                <Alert variant="info">There are no Mockups yet</Alert>
              ) : (
                <ListGroup>
                  {attachments.map((attachment, i) => {
                    return (
                      <MockupListItem
                        key={i}
                        name={attachment.name}
                        page={page}
                        refresh={refresh}
                      />
                    );
                  })}
                </ListGroup>
              )}
              <div style={{ display: "flex", flexDirection: "row" }}>
                <Form.Label>Add Mockup</Form.Label>
                <Form.Control
                  style={{
                    width: "300px",
                    marginLeft: "8px",
                    marginRight: "8px",
                  }}
                  type="text"
                  value={newMockupName}
                  onChange={(e) => setNewMockupName(e.target.value)}
                />
                <Button
                  disabled={newMockupName == ""}
                  onClick={() =>
                    setSearchParams((x) => {
                      x.set("attachment", newMockupName + ".lofi");
                      return x;
                    })
                  }
                >
                  Add Mockup
                </Button>
              </div>
            </div>
          </div>
        );
      }}
    </WithMultiData>
  );
}

function OpenAttachment({
  page,
  attachment,
}: {
  attachment: string;
  page: string;
}) {
  const data = useLoader(async () => {
    const response = await fetchDataRaw(
      xwiki({
        url: page + "/attachments/" + attachment,
      })
    );
    const repo = await repository;
    if (response.status == 404) {
      repo.clear();
      return true;
    } else if (response.ok) {
      await repo.loadZip(await response.blob());
      return true;
    }
    return false;
  }, []);

  return (
    <WithLoader data={data}>
      {(success) =>
        success ? (
          <InnerApp downloadName={attachment} />
        ) : (
          <div>Loading Attachment Failed</div>
        )
      }
    </WithLoader>
  );
}

export function XwikiPageMockups() {
  const [searchParams, setSearchParams] = useSearchParams();
  const attachment = searchParams.get("attachment");
  const page = searchParams.get("page");

  if (page == null) {
    return <>No Page Specified</>;
  }
  return attachment ? (
    <OpenAttachment {...{ attachment, page }} />
  ) : (
    <XwikiPageMockupsIndex {...{ page: page! }} />
  );
}

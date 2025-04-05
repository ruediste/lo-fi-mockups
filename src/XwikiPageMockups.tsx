import { MouseEventHandler, Suspense, use, useState } from "react";
import {
  Alert,
  Button,
  Form,
  ListGroup,
  Spinner,
  Stack,
} from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import {
  RelativeRoutingType,
  To,
  useHref,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { MainApp } from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { repository } from "./repository";
import { confirm } from "./util/confirm";
import {
  fetchData,
  FetchDataArgs,
  fetchDataRaw,
  useLoader,
} from "./util/fetchData";
import { WithLoader, WithMultiData } from "./util/UseData";

function xwiki<T>(args: FetchDataArgs): FetchDataArgs {
  return {
    ...args,
    url: (import.meta.env.DEV ? "/xwikiApi/rest/" : "/rest/") + args.url,
    basicAuth: { username: "admin", password: "admin" },
  };
}

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

function useSearchHref(
  to: To | ({ search?: { [key: string]: string | null } } & Omit<To, "search">),
  relative?: {
    relative?: RelativeRoutingType;
  }
): { href: string; onClick: MouseEventHandler<HTMLElement> } {
  const location = useLocation();
  const navigate = useNavigate();
  if (typeof to === "object" && typeof to.search === "object") {
    const search = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(to.search)) {
      if (value !== null) search.set(key, value);
      else search.delete(key);
    }
    to = { ...to, search: search.toString() };
  }
  const href = useHref(to as any, relative);
  return {
    href,
    onClick: (e) => {
      e.stopPropagation();
      e.preventDefault();
      navigate(to as any, relative);
    },
  };
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
                {/* {document.referrer != "" && (
                  <CloseButton
                    style={{ marginLeft: "auto" }}
                    onClick={() => history.back()}
                  />
                )} */}
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
          <MainApp
            projectData={use(repository).projectData}
            downloadName={attachment}
          />
        ) : (
          <div>Loading Attachment Failed</div>
        )
      }
    </WithLoader>
  );
}

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
          setSearchParams((x) => {
            x.delete("attachment");
            return x;
          });
        }}
      >
        Save & Close
      </Button>
    </>
  );
}

export function XwikiPageMockups() {
  const [searchParams, setSearchParams] = useSearchParams();
  const attachment = searchParams.get("attachment");
  const page = searchParams.get("page");

  if (page == null) {
    return <>No Page Specified</>;
  }
  console.log(searchParams, attachment);
  return (
    <ErrorBoundary>
      <Suspense fallback={<Spinner />}>
        {attachment ? (
          <OpenAttachment {...{ attachment, page }} />
        ) : (
          <XwikiPageMockupsIndex {...{ page: page! }} />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}

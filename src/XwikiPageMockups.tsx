import { Suspense, use } from "react";
import { Spinner } from "react-bootstrap";
import { ErrorBoundary } from "./ErrorBoundary";
import { cache, fetchData, FetchDataArgs } from "./util/useData";

function fetchXwikiData<T>(args: FetchDataArgs) {
  return fetchData<T>({
    ...args,
    url: "/xwikiApi/rest/wikis/" + args.url,
    basicAuth: { username: "admin", password: "admin" },
  });
}

interface XwikiAttachments {
  attachments: [{ name: string }];
}
const attachments = cache(
  () =>
    fetchXwikiData<XwikiAttachments>({
      url: "xwiki/spaces/test2/spaces/LoFiTest/pages/WebHome/attachments/",
    }),
  []
);

export function XwikiPageMockups() {
  const data = use(attachments());
  return (
    <ErrorBoundary>
      <Suspense fallback={<Spinner />}>
        <ul>
          {data.attachments.map((attachment, i) => (
            <li>{attachment.name}</li>
          ))}
        </ul>
        <pre> {JSON.stringify(data, undefined, 2)}</pre>
      </Suspense>
    </ErrorBoundary>
  );
}

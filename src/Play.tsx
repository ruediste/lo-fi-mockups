import { useCallback, useEffect, useMemo } from "react";
import { CloseButton } from "react-bootstrap";
import { ArrowLeft, ArrowRight } from "react-bootstrap-icons";
import { useRerenderOnEvent } from "./hooks";
import { IconButton } from "./Inputs";
import { PageItem, PageItemRenderContext } from "./model/PageItem";
import { useProject } from "./repository";

function RenderItem({ item }: { item: PageItem }) {
  useRerenderOnEvent(item.onChange);
  return <>{item.renderContent()}</>;
}

export function Play({}: {}) {
  const project = useProject();
  useRerenderOnEvent(project.onChange);
  useEffect(() => {
    if (!project.currentPage && project.data.pages.length > 0)
      project.selectPage(project.data.pages[0]);
  }, [project.currentPage]);

  const escFunction = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      history.back();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", escFunction, false);

    return () => {
      document.removeEventListener("keydown", escFunction, false);
    };
  }, [escFunction]);

  const page = project.currentPage;

  const ctx = useMemo(
    () => ({
      isPlay: true,
      openPage: (pageId: number) => project.selectPageId(pageId),
    }),
    [project]
  );

  return (
    <div
      style={{
        position: "relative",
        flexGrow: 1,
        flexShrink: 1,
        minHeight: "0px",
      }}
    >
      <PageItemRenderContext.Provider value={ctx}>
        {page && (
          <svg
            viewBox={page.boundingViewBox(32)}
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            {page.masterItems.concat(page.ownItems).map((item) => (
              <RenderItem key={item.id} item={item} />
            ))}
          </svg>
        )}
      </PageItemRenderContext.Provider>
      <div style={{ position: "absolute", top: "8px", right: "8px" }}>
        <span style={{ marginRight: "8px" }}>{page?.data.name}</span>
        <IconButton onClick={() => project.selectPreviousPage()}>
          <ArrowLeft />
        </IconButton>
        <IconButton onClick={() => project.selectNextPage()}>
          <ArrowRight />
        </IconButton>
        <CloseButton onClick={() => history.back()} />
      </div>
    </div>
  );
}

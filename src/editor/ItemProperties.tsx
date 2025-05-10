import { useProject } from "@/editor/EditorState";
import { Project } from "@/model/Project";
import { IconWidget } from "@/widgets/IconWidget";
import {
  ArrowDown,
  ArrowUp,
  Back,
  Copy,
  Front,
  Trash,
} from "react-bootstrap-icons";
import { PageItem } from "../model/PageItem";
import { useRerenderOnEvent } from "../util/hooks";
import { IconButton } from "../util/Inputs";
import { Widget } from "../widgets/Widget";
import { Selection } from "./Selection";

function SingleItemProperties({
  item,
  project,
}: {
  item: PageItem;
  project: Project;
}) {
  useRerenderOnEvent(item?.onChange);
  if (item instanceof Widget) {
    return (
      <>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <h1 style={{ marginRight: "auto" }}> {item.label} </h1>
          {!item.fromMasterPage && (
            <IconButton
              onClick={() => {
                const clone = item.page.duplicateItem(item);
                project.currentPage?.setSelection(Selection.of(clone));
              }}
            >
              <Copy size={24} />
            </IconButton>
          )}
          {!item.fromMasterPage && (
            <IconButton
              onClick={() => {
                item.page.removeItem(item.data.id);
                project.currentPage?.setSelection(Selection.empty);
              }}
            >
              <Trash size={24} />
            </IconButton>
          )}
        </div>
        {!item.fromMasterPage && (
          <>
            <IconButton onClick={() => item.page.moveFront(item)}>
              <Front />
            </IconButton>
            <IconButton onClick={() => item.page.moveUp(item)}>
              <ArrowUp />
            </IconButton>
            <IconButton onClick={() => item.page.moveDown(item)}>
              <ArrowDown />
            </IconButton>
            <IconButton onClick={() => item.page.moveBack(item)}>
              <Back />
            </IconButton>
          </>
        )}
        <div style={{ marginLeft: "4px" }}>
          {item.properties
            .filter((p) => p.shouldRender())
            .map((p) => {
              const result = p.render();
              if (result == null) return null;
              return <div key={item.id + "-" + p.id}>{result}</div>;
            })}
        </div>
      </>
    );
  }
  return (
    <>
      {typeof item} {(item as any).constructor.name}{" "}
      {"" + (item instanceof IconWidget)}
    </>
  );
}

export function ItemProperties() {
  const project = useProject();
  useRerenderOnEvent(project.currentPage?.onChange);
  const selection = project.currentPage?.selection;
  return (
    <div style={{ overflow: "auto", height: "100%" }}>
      {selection?.size === 0 && <h1> No selected Item </h1>}
      {selection?.size === 1 && (
        <SingleItemProperties item={selection.single} project={project} />
      )}
      {selection !== undefined && selection.size > 1 && (
        <>
          <h1> Multiple selected Items </h1>
          <IconButton
            onClick={() => {
              project.currentPage?.removeSelectedItems();
            }}
          >
            <Trash size={24} />
          </IconButton>
        </>
      )}
    </div>
  );
}

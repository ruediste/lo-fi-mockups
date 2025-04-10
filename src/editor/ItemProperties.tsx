import { useProject } from "@/editor/EditorState";
import { ArrowDown, ArrowUp, Back, Front, Trash } from "react-bootstrap-icons";
import { useRerenderOnEvent } from "../hooks";
import { IconButton } from "../Inputs";
import { PageItem } from "../model/PageItem";
import { Selection } from "../Selection";
import { Widget } from "../widgets/Widget";

function SingleItemProperties({
  item,
  clearSelection,
}: {
  item: PageItem;
  clearSelection: () => void;
}) {
  useRerenderOnEvent(item?.onChange);
  if (item instanceof Widget) {
    return (
      <>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1> {item.label} </h1>
          {!item.fromMasterPage && (
            <IconButton
              onClick={() => {
                item.page.removeItem(item.data.id);
                clearSelection();
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
              return <div key={p.id}>{result}</div>;
            })}
        </div>
      </>
    );
  }
  return <></>;
}

export function ItemProperties() {
  const project = useProject();
  useRerenderOnEvent(project.currentPage?.onChange);
  const selection = project.currentPage?.selection;
  return (
    <div style={{ overflow: "auto", height: "100%" }}>
      {selection?.size === 0 && <h1> No selected Item </h1>}
      {selection?.size === 1 && (
        <SingleItemProperties
          item={selection.single}
          clearSelection={() =>
            project.currentPage?.setSelection(Selection.empty)
          }
        />
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

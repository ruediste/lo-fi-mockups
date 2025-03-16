import { Form } from "react-bootstrap";
import { ArrowDown, ArrowUp, Back, Front, Trash } from "react-bootstrap-icons";
import { useRerenderOnEvent } from "./hooks";
import { IconButton } from "./Inputs";
import { PageItem } from "./model/PageItem";
import { Widget } from "./widgets/Widget";

export function ItemProperties({
  item,
  clearSelection,
}: {
  item: PageItem | undefined;
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
        <Form>
          {item.properties
            .filter((p) => p.shouldRender())
            .map((p) => {
              const result = p.render();
              if (result == null) return null;
              return <div key={p.id}>{result}</div>;
            })}
        </Form>
      </>
    );
  }
  return <h1>No Item Selected</h1>;
}

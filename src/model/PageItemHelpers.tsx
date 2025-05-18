import { InlineEdit } from "@/util/InlineEdit";
import { InlinePageReferenceInput } from "@/util/PageReferenceInput";
import { Form } from "react-bootstrap";
import { GripVertical, Trash } from "react-bootstrap-icons";
import { IconButton } from "../util/Inputs";
import { SortableListItem } from "../util/SortableList";
import { Project } from "./Project";

export interface Item {
  id: number;
  label: string;
  link?: number;
}

export function ItemListPropertyItem({
  item,
  idx,
  setLabel,
  setLink,
  selected,
  setSelected,
  itemEditable,
  selectionEditable,
  removeItem,
  project,
  hideGrip,
}: {
  item: Item;
  idx: number;
  setLabel: (value: string) => void;
  setLink: (value: number | undefined) => void;
  selected?: boolean;
  setSelected?: (value: boolean) => void;
  itemEditable: boolean;
  selectionEditable: boolean;
  removeItem: (id: number) => void;
  project: Project;
  hideGrip?: boolean;
}) {
  return (
    <SortableListItem
      id={item.id}
      idx={idx}
      style={{ display: "flex", alignItems: "center" }}
    >
      {!hideGrip && <GripVertical style={{ marginLeft: "-12px" }} />}
      <InlineEdit
        text={item.label}
        disabled={!itemEditable}
        edit={(stop) => (
          <span onPointerDown={(e) => e.stopPropagation()}>
            <Form.Control
              autoFocus
              value={item.label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={stop}
              onKeyDown={(e) => {
                if (e.key === "Enter") stop();
              }}
            />
          </span>
        )}
      />
      <div style={{ marginLeft: "auto" }}></div>

      <InlinePageReferenceInput
        project={project}
        setPageId={(e) => setLink(e)}
        pageId={item.link}
      />
      {selected !== undefined ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (selectionEditable) setSelected?.(!selected);
          }}
          style={{
            paddingLeft: "20px",
            paddingRight: "10px",
            marginRight: "-10px",
            marginTop: "-8px",
            paddingTop: "8px",
            marginBottom: "-8px",
            paddingBottom: "8px",
          }}
        >
          <Form.Check
            type="checkbox"
            onClick={(e) => e.stopPropagation()}
            checked={selected}
            onChange={() => setSelected?.(!selected)}
            disabled={!selectionEditable}
          />
        </div>
      ) : null}

      {itemEditable && (
        <IconButton
          style={{ marginLeft: "8px" }}
          onClick={() => removeItem(item.id)}
        >
          <Trash />
        </IconButton>
      )}
    </SortableListItem>
  );
}

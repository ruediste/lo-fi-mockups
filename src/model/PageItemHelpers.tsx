import { useState } from "react";
import { Form } from "react-bootstrap";
import { GripVertical, Trash } from "react-bootstrap-icons";
import { IconButton } from "../Inputs";
import { SortableListItem } from "../SortableList";
export function ItemListPropertyItem({
  item,
  idx,
  setLabel,
  selected,
  setSelected,
  itemEditable,
  selectionEditable,
  removeItem,
}: {
  item: {
    id: number;
    label: string;
  };
  idx: number;
  setLabel: (value: string) => void;
  selected?: boolean;
  setSelected?: (value: boolean) => void;
  itemEditable: boolean;
  selectionEditable: boolean;
  removeItem: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <SortableListItem
      id={item.id}
      idx={idx}
      onClick={() => itemEditable && setEditing(true)}
      style={{ display: "flex", alignItems: "center" }}
    >
      <GripVertical style={{ marginLeft: "-12px" }} />
      {editing ? (
        <Form.Control
          autoFocus
          value={item.label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setEditing(false);
          }}
        />
      ) : (
        item.label
      )}
      {selected !== undefined ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (selectionEditable) setSelected?.(!selected);
          }}
          style={{
            marginLeft: "auto",
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

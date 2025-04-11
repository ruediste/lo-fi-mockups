import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode } from "react";
import { ListGroup, ListGroupItemProps, ListGroupProps } from "react-bootstrap";
import { BsPrefixProps, ReplaceProps } from "react-bootstrap/esm/helpers";

export function SortableListItem({
  id,
  idx,
  children,
  ...attrs
}: {
  id: string | number;
  idx: number;
  children?: ReactNode;
} & Omit<ReplaceProps<"a", BsPrefixProps<"a"> & ListGroupItemProps>, "id">) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: id,
      data: { idx },
    });
  const { style, ...others } = attrs;
  return (
    <ListGroup.Item
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        ...style,
      }}
      {...others}
    >
      {children}
    </ListGroup.Item>
  );
}

export function SortableList<
  T extends
    | UniqueIdentifier
    | {
        id: UniqueIdentifier;
      }
>({
  items,
  setItems,
  children,
  disabled,
  ...others
}: {
  items: T[];
  // always invoked with a new array
  setItems: (newItems: T[]) => void;
  children: (item: T, idx: number) => ReactNode;
  disabled?: boolean;
} & Omit<
  ReplaceProps<"div", BsPrefixProps<"div"> & ListGroupProps>,
  "children"
>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <DndContext
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={items}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <ListGroup {...others}>
          {items.map((item, idx) => children(item, idx))}
        </ListGroup>
      </SortableContext>
    </DndContext>
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over === null) return;

    if (active.id !== over.id) {
      const oldIndex = active.data.current!.idx;
      const newIndex = over.data.current!.idx;
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  }
}

import { confirm } from "@/util/confirm";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
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
import { useState } from "react";
import { Button, Form, ListGroup } from "react-bootstrap";
import { GripVertical, Trash } from "react-bootstrap-icons";
import { useRerenderTrigger } from "./hooks";
import { IconButton } from "./Inputs";
import { PageData } from "./model/Page";
import { Project } from "./model/Project";

function Page({
  page,
  project,
  idx,
}: {
  page: PageData;
  project: Project;
  idx: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: page.id, data: { idx } });

  const selected = page.id === project.data.currentPageId;

  const [editName, setEditName] = useState(false);
  const [changeMasterPage, setChangeMasterPage] = useState(false);

  const triggerRerender = useRerenderTrigger();

  const masterPageName =
    page.masterPageId === undefined
      ? "No Master Page"
      : "Master Page: " + project.pageDataMap[page.masterPageId].name;

  return (
    <>
      <ListGroup.Item
        active={selected}
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={{
          transform: CSS.Translate.toString(transform),
          transition,
          display: "flex",
        }}
        onClick={() => project.selectPage(page)}
        onDoubleClick={() => setEditName(true)}
      >
        <GripVertical style={{ marginLeft: "-12px", marginTop: "4px" }} />
        {editName ? (
          <span onPointerDown={(e) => e.stopPropagation()}>
            <Form.Control
              autoFocus
              value={page.name}
              onChange={(e) => {
                page.name = e.target.value;
                project.onDataChanged();
                triggerRerender();
              }}
              onBlur={() => setEditName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditName(false);
              }}
            />
          </span>
        ) : (
          <span
            style={{ minWidth: "50px" }}
            onClick={() => selected && setEditName(true)}
          >
            {page.name}
          </span>
        )}
        {changeMasterPage ? (
          <span
            style={{ marginLeft: "auto" }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setChangeMasterPage(false);
              }}
            >
              <Form.Select
                value={page.masterPageId}
                onBlur={() => setChangeMasterPage(false)}
                onChange={(e) => {
                  const index = e.target.selectedIndex;
                  project.setMasterPage(
                    page.id,
                    index == 0 ? undefined : project.data.pages[index - 1].id
                  );
                  setChangeMasterPage(false);
                }}
              >
                <option value=""></option>
                {project.data.pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Form.Select>
            </form>
          </span>
        ) : (
          <span
            style={{ marginLeft: "auto", minWidth: "50px" }}
            onClick={() => selected && setChangeMasterPage(true)}
          >
            {masterPageName}
          </span>
        )}
        <IconButton
          style={{ marginLeft: "8px" }}
          onClick={async (e) => {
            e.stopPropagation();
            if (
              await confirm({
                confirmation: "Really delete Page '" + page.name + "'",
              })
            ) {
              project.removePage(page.id);
            }
          }}
        >
          <Trash />
        </IconButton>
      </ListGroup.Item>
    </>
  );
}
export function PageList({ project }: { project: Project }) {
  return (
    <SortableContext
      items={project.data.pages}
      strategy={verticalListSortingStrategy}
    >
      <ListGroup>
        {project.data.pages.map((page, idx) => (
          <Page page={page} idx={idx} project={project} key={page.id} />
        ))}
      </ListGroup>
    </SortableContext>
  );
}
export function Pages({ project }: { project: Project }) {
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
      <div style={{ display: "flex", flexDirection: "column" }}>
        <PageList project={project} />
        <div className="mt-3">
          <Button onClick={() => project.addPage()}>Add</Button>
        </div>
      </div>
    </DndContext>
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over === null) return;

    if (active.id !== over.id) {
      const oldIndex = active.data.current!.idx;
      const newIndex = over.data.current!.idx;
      project.reorderPages(arrayMove(project.data.pages, oldIndex, newIndex));
    }
  }
}

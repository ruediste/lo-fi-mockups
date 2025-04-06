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
import { Button, Form, ListGroup } from "react-bootstrap";
import { GripVertical, Trash } from "react-bootstrap-icons";
import { useRerenderTrigger } from "./hooks";
import { IconButton } from "./Inputs";
import { PageData } from "./model/Page";
import { Project } from "./model/Project";
import { InlineEdit } from "./util/InlineEdit";
import { InlinePageReferenceInput } from "./util/PageReferenceInput";

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
      >
        <GripVertical style={{ marginLeft: "-12px", marginTop: "4px" }} />
        <InlineEdit
          text={page.name}
          disabled={!selected}
          edit={(stop) => (
            <span onPointerDown={(e) => e.stopPropagation()}>
              <Form.Control
                autoFocus
                value={page.name}
                onChange={(e) => {
                  page.name = e.target.value;
                  project.onDataChanged();
                  triggerRerender();
                }}
                onBlur={stop}
                onKeyDown={(e) => {
                  if (e.key === "Enter") stop();
                }}
              />
            </span>
          )}
        />

        <InlinePageReferenceInput
          style={{ marginLeft: "auto" }}
          project={project}
          pageId={page.masterPageId}
          setPageId={(e) => project.setMasterPage(page.id, e)}
        />

        <IconButton
          style={{ marginLeft: "8px", marginTop: "-6px" }}
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

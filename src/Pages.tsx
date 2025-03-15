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
import { Button, Form, ListGroup, Modal } from "react-bootstrap";
import { GripVertical } from "react-bootstrap-icons";
import { useRerenderTrigger } from "./hooks";
import { ThreeDotMenu } from "./Inputs";
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
        <span onClick={() => selected && setEditName(true)}>{page.name}</span>
        <span
          style={{ marginLeft: "auto" }}
          onClick={() => selected && setChangeMasterPage(true)}
        >
          {masterPageName}
        </span>
        <ThreeDotMenu
          style={{ marginTop: "-5px", marginLeft: "8px" }}
          items={[
            { label: "Edit Name", onClick: () => setEditName(true) },
            {
              label: "Change Master Page",
              onClick: () => setChangeMasterPage(true),
            },
            {
              label: "Delete",
              onClick: () => project.removePage(page.id),
            },
          ]}
        />
      </ListGroup.Item>
      <Modal show={editName} onHide={() => setEditName(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Page Name</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEditName(false);
            }}
          >
            <Form.Control
              autoFocus
              value={page.name}
              onChange={(e) => {
                page.name = e.target.value;
                project.onDataChanged();
                triggerRerender();
              }}
            />
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setEditName(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={changeMasterPage} onHide={() => setChangeMasterPage(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Master Page</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setChangeMasterPage(false);
            }}
          >
            <Form.Select
              value={page.masterPageId}
              onChange={(e) => {
                const index = e.target.selectedIndex;
                project.setMasterPage(
                  page.id,
                  index == 0 ? undefined : project.data.pages[index - 1].id
                );
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setChangeMasterPage(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
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

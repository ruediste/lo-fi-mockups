import { Project } from "@/model/Project";
import { Form } from "react-bootstrap";
import { InlineEdit } from "./InlineEdit";

export function PageReferenceInput({
  project,
  pageId,
  setPageId,
  style,
  stop,
}: {
  project: Project;
  pageId?: number;
  setPageId: (pageId?: number) => void;
  style?: React.CSSProperties;
  stop?: () => void;
}) {
  const page =
    pageId === undefined
      ? undefined
      : project.data.pages.find((x) => x.id == pageId);

  return (
    <span style={style} onPointerDown={(e) => e.stopPropagation()}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          stop?.();
        }}
      >
        <Form.Select
          autoFocus
          value={pageId}
          onBlur={() => stop?.()}
          onChange={(e) => {
            const index = e.target.selectedIndex;
            setPageId(
              index == 0 ? undefined : project.data.pages[index - 1].id
            );
            stop?.();
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
  );
}

export function InlinePageReferenceInput(props: {
  project: Project;
  pageId?: number;
  setPageId: (pageId?: number) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const { pageId, project, style, disabled } = props;
  const page =
    pageId === undefined
      ? undefined
      : project.data.pages.find((x) => x.id == pageId);

  return (
    <InlineEdit
      style={style}
      text={page ? page.name : "Not Selected"}
      disabled={disabled}
      edit={(stop) => <PageReferenceInput {...props} stop={stop} />}
    />
  );
}

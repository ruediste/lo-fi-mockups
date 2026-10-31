import { DndContext } from "@dnd-kit/core";
import { Suspense, use } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import { HashRouter } from "react-router";
import { ToastContainer } from "react-toastify";
import App from "./App.tsx";
import { editorLayoutKey } from "./editor/Editor.tsx";
import { editorState } from "./editor/EditorState.ts";
import { ErrorBoundary } from "./util/ErrorBoundary.tsx";
import { useRerenderOnEvent } from "./util/hooks.ts";

function RootError({ clear }: { clear: () => void }) {
  const state = use(editorState);
  useRerenderOnEvent(state.onProjectReplaced);
  return (
    <div
      style={{
        display: "flex",
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card style={{}}>
        <Card.Body>
          <Card.Title>An Error Occurred</Card.Title>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              variant="primary"
              disabled={!state.hasUndo}
              onClick={async () => {
                (await editorState).undo();
                clear();
              }}
            >
              Undo
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                (await editorState).repository.clear();
                clear();
              }}
            >
              Clear Mockup Data
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                localStorage.removeItem(editorLayoutKey);
                clear();
              }}
            >
              Clear Layout Data
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default function Root() {
  return (
    <DndContext>
      <HashRouter>
        <ErrorBoundary fallback={(clear) => <RootError clear={clear} />}>
          <Suspense fallback={<Spinner />}>
            <App />
          </Suspense>
          <ToastContainer autoClose={2000} />
        </ErrorBoundary>
      </HashRouter>
    </DndContext>
  );
}

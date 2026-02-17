import { DndContext } from "@dnd-kit/core";
import { createRoot } from "react-dom/client";
import "./index.scss";

// Import init function from "@neutralinojs/lib"
import { init } from "@neutralinojs/lib";
import { Suspense } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import { HashRouter } from "react-router";
import { ToastContainer } from "react-toastify";
import App from "./App.tsx";
import { editorLayoutKey } from "./editor/Editor.tsx";
import { editorState } from "./editor/EditorState.ts";
import { ErrorBoundary } from "./util/ErrorBoundary.tsx";

if ((window as any).APP_LOADED) {
  // reload the page if the app is already loaded
  location.reload();
} else {
  (window as any).APP_LOADED = true;
}

console.log("App starting...");

export function RootError({ clear }: { clear: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card style={{ width: "18rem" }}>
        <Card.Body>
          <Card.Title>An Error Occurred</Card.Title>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              variant="primary"
              onClick={async () => {
                location.reload();
              }}
            >
              Reload
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

createRoot(document.getElementById("root")!).render(
  <DndContext>
    <HashRouter>
      <ErrorBoundary fallback={(clear) => <RootError clear={clear} />}>
        <Suspense fallback={<Spinner />}>
          <App />
        </Suspense>
        <ToastContainer autoClose={2000} />
      </ErrorBoundary>
    </HashRouter>
  </DndContext>,
);

if (window.NL_APPID) init(); // Initialize Neutralinojs

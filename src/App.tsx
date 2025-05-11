import { Editor, editorLayoutKey } from "@/editor/Editor";
import { Suspense, use } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import { HashRouter, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import { editorState, EditorStateContext } from "./editor/EditorState";
import { Play } from "./Play";
import { ErrorBoundary } from "./util/ErrorBoundary";
import "./widgets/PageItemTypeRegistry";
import { XwikiPageMockups } from "./xwiki/XwikiPageMockups";

function RootError({ clear }: { clear: () => void }) {
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

export function InnerApp({ downloadName }: { downloadName?: string }) {
  const state = use(editorState);

  return (
    <EditorStateContext.Provider value={state}>
      <Routes>
        <Route path="/" element={<Editor downloadName={downloadName} />} />
        <Route path="/play" element={<Play />} />
        <Route path="/xwiki/*" element={<XwikiPageMockups />} />
      </Routes>
    </EditorStateContext.Provider>
  );
}
export default function App() {
  return (
    <HashRouter>
      <ErrorBoundary fallback={(clear) => <RootError clear={clear} />}>
        <Suspense fallback={<Spinner />}>
          <InnerApp />
        </Suspense>
        <ToastContainer autoClose={2000} />
      </ErrorBoundary>
    </HashRouter>
  );
}

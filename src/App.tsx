import { Editor } from "@/editor/Editor";
import { Suspense } from "react";
import { Spinner } from "react-bootstrap";
import { HashRouter, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import { Play } from "./Play";
import "./widgets/PageItemTypeRegistry";
import { XwikiPageMockups } from "./xwiki/XwikiPageMockups";

export function InnerApp({ downloadName }: { downloadName?: string }) {
  return (
    <Routes>
      <Route path="/" element={<Editor downloadName={downloadName} />} />
      <Route path="/play" element={<Play />} />
    </Routes>
  );
}
export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/*" element={<InnerApp />} />
          <Route path="/xwiki/*" element={<XwikiPageMockups />} />
        </Routes>
      </Suspense>
      <ToastContainer autoClose={2000} />
    </HashRouter>
  );
}

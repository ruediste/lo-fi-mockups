import { saveAs } from "file-saver";
import { use } from "react";
import { editorState, EditorStateContext } from "./editor/EditorState";
import { InnerApp } from "./InnerApp";
import { NativeApp } from "./native/NativeApp";
import "./widgets/PageItemTypeRegistry";
import { XwikiApp } from "./xwiki/XwikiPageMockups";

function WebApp() {
  return (
    <InnerApp
      controls={{
        saveAs: (data, filename) => saveAs(data, filename),
        projectName: "project",
      }}
    />
  );
}

function AppSwitcher() {
  switch (import.meta.env.VITE_VARIANT) {
    case "xwiki":
      return <XwikiApp />;
    case "web":
      return <WebApp />;
    case "native":
      return <NativeApp />;
  }
}
export default function App() {
  const state = use(editorState);

  return (
    <EditorStateContext.Provider value={state}>
      <AppSwitcher />
    </EditorStateContext.Provider>
  );
}

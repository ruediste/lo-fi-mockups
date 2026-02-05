import { Editor } from "@/editor/Editor";
import { Route, Routes } from "react-router";
import { EditorControlsProps } from "./editor/EditorControls";
import { Play } from "./Play";
import "./widgets/PageItemTypeRegistry";

export function InnerApp({
  controls,
}: {
  controls: Omit<EditorControlsProps, "resetLayout">;
}) {
  return (
    <Routes>
      <Route path="/" element={<Editor {...{ controls }} />} />
      <Route path="/play" element={<Play />} />
    </Routes>
  );
}

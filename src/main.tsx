import { DndContext } from "@dnd-kit/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.scss";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DndContext>
      <App />
    </DndContext>
  </StrictMode>
);

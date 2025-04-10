import { createContext } from "react";
import { CanvasProjection } from "./editor/Canvas";

export const ProjectionContext = createContext<CanvasProjection>(null as any);

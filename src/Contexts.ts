import { createContext } from "react";
import { CanvasProjection } from "./Canvas";

export const ProjectionContext = createContext<CanvasProjection>(null as any);

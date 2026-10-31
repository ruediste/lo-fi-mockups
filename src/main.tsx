import { init } from "@neutralinojs/lib";
import { createRoot } from "react-dom/client";
import "./index.scss";
import Root from "./Root.tsx";

console.log("App starting...");

createRoot(document.getElementById("root")!).render(<Root />);

if (window.NL_APPID) init(); // Initialize Neutralinojs

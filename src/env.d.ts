/// <reference types="vite/client" />

declare global {
  // Note the capital "W"
  interface Window {
    NL_APPID?: string;
    NL_ARGS?: string[];
  }
}

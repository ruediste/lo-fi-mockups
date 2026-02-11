/// <reference types="vite/client" />

declare global {
  interface Window {
    NL_APPID?: string;
    NL_ARGS?: string[];
    vscode: {
      postMessage: (message: any) => void;
    };
  }
  interface Uint8ArrayConstructor {
    fromBase64: (base64: string) => Uint8Array;
  }

  interface Uint8Array {
    toBase64: () => string;
  }
}

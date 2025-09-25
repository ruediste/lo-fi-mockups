import type { Config } from "jest";

export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+.tsx?$": ["ts-jest", { tsconfig: "tsconfig.app.json" }],
  },
  roots: ["<rootDir>/src/"],
} satisfies Config;

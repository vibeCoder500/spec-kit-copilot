import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "node:url";

export default [
    { ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**"] },
    { ...js.configs.recommended, files: ["**/*.mjs"], languageOptions: {
        ecmaVersion: "latest", sourceType: "module",
        globals: { process: "readonly", console: "readonly", Buffer: "readonly", URL: "readonly" },
    } },
    ...tseslint.configs.recommended.map((config) => ({ ...config, files: ["**/*.ts"] })),
    {
        ...js.configs.recommended,
        basePath: fileURLToPath(new URL("../../../../../", import.meta.url)),
        files: ["scripts/canvas-reader/**/*.mjs"],
        languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: {
            process: "readonly", console: "readonly", Buffer: "readonly", URL: "readonly", fetch: "readonly", AbortController: "readonly",
            setTimeout: "readonly", clearTimeout: "readonly", setImmediate: "readonly", clearInterval: "readonly", Headers: "readonly",
            Response: "readonly", structuredClone: "readonly", document: "readonly", innerWidth: "readonly",
        } },
    },
    {
        basePath: fileURLToPath(new URL("../../../../../", import.meta.url)),
        files: ["scripts/canvas-reader/test/*.spec.mjs"],
        languageOptions: { globals: { window: "readonly", MutationObserver: "readonly", performance: "readonly",
            requestAnimationFrame: "readonly", getComputedStyle: "readonly" } },
    },
];
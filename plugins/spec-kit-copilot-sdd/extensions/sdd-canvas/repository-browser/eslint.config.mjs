import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
    { ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**"] },
    { ...js.configs.recommended, files: ["**/*.mjs"], languageOptions: {
        ecmaVersion: "latest", sourceType: "module",
        globals: { process: "readonly", console: "readonly", Buffer: "readonly", URL: "readonly" },
    } },
    ...tseslint.configs.recommended.map((config) => ({ ...config, files: ["**/*.ts"] })),
];
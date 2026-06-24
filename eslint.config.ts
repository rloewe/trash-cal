import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'


export default defineConfig(
  {
    files: ["src/**/*.{mjs,ts,mts,cts}"],
    ignores: ["lib/**/*", "node_modules"],
    plugins: { js },
    extends: ["js/recommended", tseslint.configs.recommended, eslintPluginPrettierRecommended],
    languageOptions: { globals: globals.browser, parser: tsParser, parserOptions: { projectService: true } },
    rules: {
      "prettier/prettier": ["error", { printWidth: 120, singleQuote: true, semi: false, trailingComma: 'none', allowParens: 'avoid' }],
    }
  }
);

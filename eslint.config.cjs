const { defineConfig } = require("eslint/config");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const importPlugin = require("eslint-plugin-import");
const prettierPlugin = require("eslint-plugin-prettier");
const unusedImportsPlugin = require("eslint-plugin-unused-imports");

module.exports = defineConfig([
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
      "unused-imports": unusedImportsPlugin,
      import: importPlugin,
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // Unused imports
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",

      // Import order
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // Désactivation de règles inutiles
      "import/default": "off",
      "import/named": "off",
      "import/namespace": "error",
      "import/export": "error",

      // Interdire les extensions dans les imports locaux
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          ts: "never",
          js: "never",
        },
      ],

      // Formatage
      "prettier/prettier": "error",
    },
  },
  {
    ignores: ["dist/*"],
  },
]);

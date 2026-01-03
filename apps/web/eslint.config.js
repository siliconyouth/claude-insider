import { nextJsConfig } from "@repo/eslint-config/next-js";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  // Special configuration for scripts directory - allow Node.js globals
  {
    files: ["scripts/**/*.mjs", "scripts/**/*.ts", "scripts/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Scripts are not part of the main app, relax rules
      "@typescript-eslint/no-unused-vars": "off", // Allow unused vars in scripts
      "no-unused-vars": "off", // Allow unused vars in scripts
      "no-undef": "off", // Allow Node.js globals like process
      "no-redeclare": "off", // Allow redeclaring globals like process
      "turbo/no-undeclared-env-vars": "off", // Scripts access env vars directly
      "no-useless-escape": "off", // Scripts may have regex patterns
      "no-empty": "off", // Allow empty catch blocks in scripts
    },
  },
];

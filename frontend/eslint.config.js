import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/preserve-manual-memoization": "error",
    },
  },
  {
    files: ["src/Components/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@tanstack/react-query",
          message: "Components consume feature hooks; Query ownership belongs under src/features.",
        }],
        patterns: [{
          group: ["**/services/**"],
          message: "Components must not call transport services directly; expose an owning feature API or hook.",
        }],
      }],
    },
  },
  globalIgnores([".next/**", "dist/**", "out/**", "coverage/**", "next-env.d.ts"]),
]);

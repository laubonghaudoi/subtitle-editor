const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");
const globals = require("globals");

module.exports = [
  ...nextCoreWebVitals,
  {
    ignores: [
      ".next/",
      ".open-next/",
      ".vercel/",
      "node_modules/",
      "public/",
      "tests/fixtures/",
      "next-env.d.ts",
      "**/eslint.config.js",
    ],
  },
  {
    files: [
      "components/app-header/settings-dialog.tsx",
      "components/bulk-offset/controls.tsx",
      "components/bulk-offset/drawer.tsx",
      "components/custom-controls.tsx",
      "components/find-replace/index.tsx",
      "components/local-session-recovery.tsx",
      "components/subtitle/subtitle-item-text-editor.tsx",
      "components/subtitle/subtitle-time-fields.tsx",
      "context/subtitle-context.tsx",
      "hooks/use-bulk-offset-state.ts",
      "hooks/use-droppable-panel.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["tests/**/*.test.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];

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

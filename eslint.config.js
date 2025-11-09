const { FlatCompat } = require("@eslint/eslintrc");
const globals = require("globals");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

module.exports = [
  {
    ignores: [
      ".next/",
      ".vercel/",
      "node_modules/",
      "public/",
      "tests/fixtures/",
      "next-env.d.ts",
      "**/eslint.config.js",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    files: ["tests/**/*.test.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];

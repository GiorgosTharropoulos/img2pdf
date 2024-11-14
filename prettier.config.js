import { fileURLToPath } from "node:url";

/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig} */
const config = {
  plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
  tailwindConfig: fileURLToPath(new URL("tailwind.config.js", import.meta.url)),
  tailwindFunctions: ["cn", "cva"],
  importOrder: [
    "<TYPES>",
    "^node:",
    "^(react/(.*)$)|^(react$)|^(react-native(.*)$)",
    "<THIRD_PARTY_MODULES>",
    "",
    "",
    "<TYPES>^[.|..|~]",
    "^~/",
    "^[../]",
    "^[./]",
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  importOrderTypeScriptVersion: "4.4.0",
  semi: true,
  printWidth: 100,
};

export default config;

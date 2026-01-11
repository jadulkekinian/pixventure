import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript 相关规则 - Re-enabled critical rules
      "@typescript-eslint/no-explicit-any": "warn", // Changed from off to warn
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/prefer-as-const": "warn",
      "@typescript-eslint/no-floating-promises": "error", // Added

      // React 相关规则
      "react-hooks/exhaustive-deps": "warn", // Changed from off to warn
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/prop-types": "off",

      // Next.js 相关规则
      "@next/next/no-img-element": "warn", // Changed from off to warn
      "@next/next/no-html-link-for-pages": "off",

      // 一般JavaScript规则
      "prefer-const": "warn", // Changed from off to warn
      "no-unused-vars": "off", // Keep off in favor of TS rule
      "no-console": ["warn", { "allow": ["warn", "error"] }], // Changed
      "no-debugger": "warn", // Changed from off to warn
      "no-empty": "warn",
      "no-irregular-whitespace": "warn",
      "no-case-declarations": "warn",
      "no-fallthrough": "warn",
      "no-mixed-spaces-and-tabs": "error", // Changed to error
      "no-redeclare": "off",
      "no-undef": "off",
      "no-unreachable": "warn",
      "no-useless-escape": "warn",
    },
  },
];

export default eslintConfig;

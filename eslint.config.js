import globals from "globals";
import prettier from "eslint-config-prettier";
import pluginJs from '@eslint/js'
import stylisticJs from '@stylistic/eslint-plugin-js';

export default [
  {
    name: "11ty/setup/js",
    ...pluginJs.configs.recommended,
  },
  {
    name: "11ty/setup/prettier",
    ...prettier,
  },
  {
    name: "11ty/rules/project-specific",
    plugins: {
      "@stylistic/js": stylisticJs,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-async-promise-executor": "warn",
      "no-prototype-builtins": "warn",
      "no-unused-vars": "warn",
      "@stylistic/js/space-unary-ops": "error",
    },
  },
];

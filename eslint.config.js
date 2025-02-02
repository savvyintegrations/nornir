import {FlatCompat} from "@eslint/eslintrc";
import path from "path";
import {fileURLToPath} from "url";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    recommendedConfig: {},
    baseDirectory: __dirname,
});

/**
 * @type {import('eslint').Linter.Config}
 */
const test = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:unicorn/recommended",
        "plugin:jest/recommended",
        "plugin:jest/style",
        "plugin:workspaces/recommended",
        "plugin:eslint-comments/recommended",
        "plugin:sonarjs/recommended",
    ],
    parser: "@typescript-eslint/parser",
    plugins: [
        "@typescript-eslint",
        "eslint-plugin-workspaces",
        "eslint-plugin-unicorn",
        "eslint-plugin-jest",
        "eslint-plugin-eslint-comments",
        "eslint-plugin-sonarjs",
        "eslint-plugin-no-secrets",
    ],
    root: true,
    ignorePatterns: [
        "dist",
        "node_modules",
        "**/*.js",
        "**/*.cjs"
    ],
    rules: {
        // Reduce is confusing, but it shouldn't be banned
        "unicorn/no-array-reduce": ["off"],
        "unicorn/filename-case": ["error", {
            case: "kebabCase",
        }],
        "unicorn/no-empty-files": ["off"],
        "workspaces/require-dependency": ["off"],
        "unicorn/prevent-abbreviations": ["off"],
        "no-secrets/no-secrets": ["warn", {"tolerance": 5.0}],
        "unicorn/numeric-separators-style": ["off"],
        "@typescript-eslint/no-unused-vars": ["warn",   {
            "argsIgnorePattern": "^_",
            "varsIgnorePattern": "^_",
            "caughtErrorsIgnorePattern": "^_"
        }],
        "@typescript-eslint/naming-convention": ["error",
            {
                selector: 'class',
                format: ['PascalCase'],
                leadingUnderscore: 'allow'
            },
            {
                selector: 'typeLike',
                format: ['PascalCase'],
                "custom": {
                    "regex": "^I[A-Z]",
                    "match": false
                }
            },
        ],
        "sonarjs/no-duplicate-string": ["off"],
    },
};

export default [
    {
        ignores: ["**/*.d.ts", "dist/**/*"],
    },
    ...compat.config(test),
];

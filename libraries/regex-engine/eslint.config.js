const tsEslint = require('typescript-eslint');
const eslintImport = require("eslint-plugin-import");

module.exports = tsEslint.config(
    ...tsEslint.configs.strict,
    ...tsEslint.configs.stylistic,
    {
        ignores: [
            "out",
            "dist",
            "node_modules",
            "**/*.d.ts",
            "**/*.js"
        ]
    },
    {
        plugins: {
            eslintImport
        },
        rules: {
            "eslintImport/no-cycle": [
                "error"
            ]
        }
    },
    {
        rules: {
            "@typescript-eslint/consistent-type-definitions": [
                "error",
                "type"
            ],
            "@typescript-eslint/consistent-type-assertions": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/prefer-for-of": "off",
            "@typescript-eslint/no-var-requires": "off"
        }
    },
    {
        files: ['**/*.js'],
        ...tsEslint.configs.disableTypeChecked,
    }
);

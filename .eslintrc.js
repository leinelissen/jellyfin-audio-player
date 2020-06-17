module.exports = {
    env: {
        es6: true,
        node: true
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        // "plugin:@typescript-eslint/recommended"
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        },
        ecmaVersion: 2018,
        sourceType: 'module'
    },
    plugins: [
        'react',
        '@typescript-eslint'
    ],
    rules: {
        indent: [
            'error',
            4,
            {
                SwitchCase: 1,
            }
        ],
        "linebreak-style": [
            'error',
            'unix'
        ],
        quotes: [
            'error',
            'single'
        ],
        semi: [
            'error',
            'always'
        ],
        "no-unused-vars": "off",
        "react/prop-types": "off",
        "@typescript-eslint/no-unused-vars": [
          "error"
        ]
    }
};
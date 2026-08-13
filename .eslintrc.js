module.exports = {
    root: true,
    extends: '@react-native',
    rules: {
        // Enforce 4-space indentation
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        // Disable the base rule which doesn't understand TS method overloads,
        // and enable the TypeScript-aware replacement instead.
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': 'error',
    },
};
module.exports = {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
        [
            'module-resolver',
            {
                root: ['.'],
                extensions: [
                    '.ios.ts',
                    '.android.ts',
                    '.ts',
                    '.ios.tsx',
                    '.android.tsx',
                    '.tsx',
                    '.jsx',
                    '.js',
                    '.json',
                ],
                alias: {
                    '@': './src',
                }
            }
        ],
        [
            'inline-import',
            {
                extensions: ['.sql'],
            },
        ],
        [
            'module:react-native-dotenv'
        ],
        '@babel/plugin-proposal-numeric-separator',
        'react-native-worklets/plugin',
    ]
};

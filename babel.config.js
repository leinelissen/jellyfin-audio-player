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
            'module:react-native-dotenv'
        ],
        'react-native-reanimated/plugin',
        '@babel/plugin-proposal-numeric-separator'
    ]
};

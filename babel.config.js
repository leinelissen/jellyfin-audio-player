module.exports = {
    presets: [
        'module:metro-react-native-babel-preset',
    ],
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
                    store: './src/store',
                    components: './src/components',
                    utility: './src/utility',
                    screens: './src/screens',
                    assets: './src/assets',
                    '@localisation': './src/localisation',
                    CONSTANTS: './src/CONSTANTS',
                }
            }
        ],
        [
            'module:react-native-dotenv'
        ],
        'react-native-reanimated/plugin'
    ]
};

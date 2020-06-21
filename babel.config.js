module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
        [
            'module-resolver',
            {
                // root: ['./src'],
                alias: {
                    store: './src/store',
                    components: './src/components',
                    utility: './src/utility',
                    screens: './src/screens',
                    CONSTANTS: './src/CONSTANTS',
                }
            }
        ]
    ]
};

module.exports = {
    haste: {
        defaultPlatform: 'ios',
        platforms: ['android', 'ios', 'native'],
    },
    resolver: 'react-native/jest/resolver.js',
    transform: {
        '^.+\\.(js|ts|tsx)$': 'babel-jest',
        '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': 'react-native/jest/assetFileTransformer.js',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(.pnpm|react-native|@react-native|react-native-.*|@react-navigation|i18n-js|make-plural)/)',
    ],
    testEnvironment: 'react-native/jest/react-native-env.js',
    setupFiles: ['<rootDir>/jest.setup.js'],
};

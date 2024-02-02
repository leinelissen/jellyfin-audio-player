module.exports = {
    project: {
        ios: {},
        android: {}
    },
    assets: ['./src/assets/fonts/'],
    dependencies: {
        // Deal with unruly react-native-flipper dependencies, per: https://github.com/facebook/flipper/issues/5266
        'react-native-flipper': {
            platforms: {
                ios: null,
            },
        },
    }
};

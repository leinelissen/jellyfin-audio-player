const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    transformer: {
        babelTransformerPath: require.resolve('./scripts/transformer.js'),

    },
    resolver: {
        assetExts: [
            ...assetExts.filter((ext) => ext !== 'svg'),
        ],
        sourceExts: [
            ...sourceExts,
            'svg',
            'md'
        ]
    },

    // plugins: [
    //     ['content-transformer', {
    //         transformers: [
    //             {
    //                 file: /\.md$/,
    //                 format: 'string'
    //             }
    //         ],
    //     }],
    // ]
};

module.exports = mergeConfig(defaultConfig, config);

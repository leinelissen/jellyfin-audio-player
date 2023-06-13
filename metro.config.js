/**
* Metro configuration for React Native
* https://github.com/facebook/react-native
*
* @format
*/

const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
    const {
        resolver: { sourceExts, assetExts }
    } = await getDefaultConfig();
    return {
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
        plugins: [
            ['content-transformer', {
                transformers: [
                    {
                        file: /\.md$/,
                        format: 'string'
                    }
                ],
            }],
        ]
    };
})();

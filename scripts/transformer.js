const upstreamTransformer = require('metro-react-native-babel-transformer');
const svgTransformer = require('react-native-svg-transformer');

/**
 * Since we are using multiple types of transformers for Metro, we need to chain
 * them into a single transform unit.
 */
module.exports.transform = function({ src, filename, options }) {
    // GUARD: Pass SVGs onto react-native-svg-transformer
    if (filename.endsWith('.svg')) {
        return svgTransformer.transform({ src, filename, options });
    // GUARD: Catch markdown files
    } else if (filename.endsWith('.md')) {
        const parsedString = src.replaceAll(/(?<!\n)\r?\n(?!\r?\n)/g, '');
        return upstreamTransformer.transform({
            src: `const content = ${JSON.stringify(parsedString)}; export default content;`,
            filename,
            options,
        });
    } else {
        // Pass any remaining files onto the regular Metro transformer
        return upstreamTransformer.transform({ src, filename, options });
    }
};
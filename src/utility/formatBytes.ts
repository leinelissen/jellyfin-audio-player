const k = 1024;
const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

/**
 * Convert a number of bytes to a human-readable string
 * CREDIT: https://gist.github.com/zentala/1e6f72438796d74531803cc3833c039c
 */
export default function formatBytes(bytes: number, decimals: number = 1) {
    if (bytes === 0) {
        return '0 Bytes';
    }

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}
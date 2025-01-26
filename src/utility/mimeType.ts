import db from 'mime-db';

const MIME_OVERRIDES: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/ogg': '.ogg'
};

/**
 * Retrieve an extension for a given URL by fetching its Content-Type
 */
export async function getExtensionForUrl(url: string) {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('Content-Type');

    // GUARD: Check that we received a content type
    if (!contentType) {
        throw new Error('Jellyfin did not return a Content-Type for a streaming URL.');
    }

    // GUARD: Check whether there is a custom override for a particular content type
    if (contentType in MIME_OVERRIDES) {
        return MIME_OVERRIDES[contentType];
    }

    // Alternatively, retrieve it from mime-db
    const extensions = db[contentType]?.extensions;

    // GUARD: Check that we received an extension
    if (!extensions?.length) {
        throw new Error(`Unsupported MIME-type ${contentType}`);
    }

    return extensions[0];
}

/**
 * Find a mime type by its extension
 */
export function getMimeTypeForExtension(extension: string) {
    return Object.keys(db).find((type) => {
        return db[type].extensions?.includes(extension);
    });
}
import mime from 'mime';

const MIME_OVERRIDES: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/ogg': '.ogg',
    'audio/flac': '.flac',
};

/**
 * Retrieve an extension for a given URL by fetching its Content-Type
 */
export async function getExtensionForUrl(url: string) {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('Content-Type');

    // GUARD: Check that the request actually returned something
    if (!response.ok) {
        throw new Error('Failed to retrieve extension for URL: ' + response.statusText);
    }

    // GUARD: Check that we received a content type
    if (!contentType) {
        throw new Error('Jellyfin did not return a Content-Type for a streaming URL.');
    }

    // GUARD: Check whether there is a custom override for a particular content type
    if (contentType in MIME_OVERRIDES) {
        return MIME_OVERRIDES[contentType];
    }

    // Alternatively, retrieve it from mime-db
    const extension = mime.getExtension(contentType);
    
    // GUARD: Check that we received an extension
    if (!extension) {
        console.error({ contentType, extension, url });
        throw new Error(`Unsupported MIME-type ${contentType}`);
    }

    return extension;
}

/**
 * Find a mime type by its extension
 */
export function getMimeTypeForExtension(extension: string) {
    return mime.getType(extension);
}
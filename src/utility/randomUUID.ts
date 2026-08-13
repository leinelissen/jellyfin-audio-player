/**
 * Returns a RFC 4122 v4 UUID string.
 *
 * React Native 0.73+ ships with `globalThis.crypto.randomUUID()` on both iOS
 * and Android (backed by the platform's native CSPRNG). We fall back to a
 * simple Math.random()-based implementation for environments (e.g. older RN
 * or Jest) where the native API is unavailable.
 */
export function randomUUID(): string {
    if (typeof globalThis?.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }

    // Fallback: RFC 4122 v4 UUID via Math.random()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
/**
 * Groups a pre-sorted array of items into alphabetical sections.
 *
 * Items are expected to already be sorted by `getSortKey` (case-insensitively).
 * The section label is the uppercase first letter of that key, or '#' for any
 * name that does not start with an ASCII letter. The '#' section, if present,
 * is always placed at the end.
 */
export function groupByAlphabet<T>(
    items: T[],
    getSortKey: (item: T) => string,
): { label: string; data: T[] }[] {
    const sections: { label: string; data: T[] }[] = [];

    for (const item of items) {
        const firstChar = getSortKey(item)[0]?.toUpperCase() ?? '#';
        const label = /^[A-Z]$/.test(firstChar) ? firstChar : '#';

        const last = sections[sections.length - 1];
        if (last?.label === label) {
            last.data.push(item);
        } else {
            sections.push({ label, data: [item] });
        }
    }

    // '#' section may land first when names start with non-alpha; move it to end
    if (sections[0]?.label === '#') {
        sections.push(sections.shift()!);
    }

    return sections;
}
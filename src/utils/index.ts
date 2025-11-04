


export function createPageUrl(pageName: string) {
    if (!pageName) {
        return '/';
    }

    const [rawPath, rawQuery] = pageName.split('?');

    const normalizedPath = rawPath
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-/]+|[-/]+$/g, '')
        .toLowerCase();

    const query = rawQuery ? `?${rawQuery}` : '';

    return `/${normalizedPath}${query}`;
}

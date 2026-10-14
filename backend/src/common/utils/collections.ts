export function groupBy<T>(rows: readonly T[], key: (row: T) => string): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    for (const row of rows) {
        const k = key(row);
        const bucket = groups.get(k);
        if (bucket) bucket.push(row);
        else groups.set(k, [row]);
    }
    return groups;
}

export const unique = <T>(items: readonly T[]): T[] => [...new Set(items)];

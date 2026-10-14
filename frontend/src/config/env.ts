const DEFAULT_API_URL = "http://localhost:8787";

function resolveApiUrl(): string {
    const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
    try {
        return new URL(raw).toString().replace(/\/+$/, "");
    } catch {
        throw new Error(`NEXT_PUBLIC_API_URL is not a valid URL: "${raw}"`);
    }
}

export const env = {
    API_URL: resolveApiUrl(),
} as const;

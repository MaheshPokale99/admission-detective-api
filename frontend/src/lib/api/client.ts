import { env } from "@/config/env";

export const API_BASE = `${env.API_URL}/api/v1`;

interface ErrorBody {
    error?: { code?: string; message?: string; details?: { reasons?: unknown } };
    requestId?: string;
}

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code: string = "unknown_error",
        public reasons: string[] = [],
        public requestId?: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

function reasonsFrom(details: unknown): string[] {
    const reasons = (details as { reasons?: unknown } | undefined)?.reasons;
    return Array.isArray(reasons) ? reasons.filter((r): r is string => typeof r === "string") : [];
}

export function toApiError(status: number, body: ErrorBody | null | undefined): ApiError {
    const err = body?.error;
    return new ApiError(
        err?.message ?? `Request failed (${status})`,
        status,
        err?.code ?? "unknown_error",
        reasonsFrom(err?.details),
        body?.requestId,
    );
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...init,
            headers: { "Content-Type": "application/json", ...init?.headers },
        });
    } catch {
        throw new ApiError("Cannot reach the server. Check your connection and try again.", 0, "network_error");
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw toApiError(res.status, data);
    return data as T;
}

export const post = <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const errorMessage = (e: unknown, fallback = "Something went wrong") =>
    e instanceof Error ? e.message : fallback;

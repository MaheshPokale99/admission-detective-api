import type { Hono } from "hono";
import type { AppEnv } from "../../src/common/http/app-env.js";

export interface ApiResponse<T = any> {
    status: number;
    body: T;
    headers: Headers;
}

/** Calls the app in-process and parses the JSON body. */
export async function call<T = any>(
    app: Hono<AppEnv>,
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
): Promise<ApiResponse<T>> {
    const res = await app.request(path, {
        method,
        headers: { "content-type": "application/json", ...headers },
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    const text = await res.text();
    return { status: res.status, body: (text ? JSON.parse(text) : null) as T, headers: res.headers };
}

export interface SseEvent {
    event: string;
    data: any;
}

/** Calls an SSE endpoint and returns every event once the stream ends. */
export async function callSse(
    app: Hono<AppEnv>,
    path: string,
): Promise<{ status: number; events: SseEvent[]; body?: any }> {
    const res = await app.request(path, { method: "POST" });
    const text = await res.text();
    if (!res.headers.get("content-type")?.includes("text/event-stream")) {
        return { status: res.status, events: [], body: text ? JSON.parse(text) : null };
    }
    const events = text
        .split("\n\n")
        .filter(Boolean)
        .map((block) => {
            const lines = block.split("\n");
            const event =
                lines
                    .find((l) => l.startsWith("event:"))
                    ?.slice(6)
                    .trim() ?? "message";
            const data = lines
                .filter((l) => l.startsWith("data:"))
                .map((l) => l.slice(5).trimStart())
                .join("\n");
            return { event, data: JSON.parse(data) };
        });
    return { status: res.status, events };
}

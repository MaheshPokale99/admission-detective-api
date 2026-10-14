import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { RateLimitError } from "../errors/app-error.js";
import type { AppEnv } from "../http/app-env.js";

export interface RateLimitOptions {
    windowMs: number;
    max: number;
    trustProxy?: boolean;
}

interface Window {
    count: number;
    resetAt: number;
}

function clientKey(c: Context<AppEnv>, trustProxy: boolean): string {
    if (trustProxy) {
        const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
        if (forwarded) return forwarded;
    }
    try {
        return getConnInfo(c).remote.address ?? "unknown";
    } catch {
        return "unknown";
    }
}

/** Fixed-window, in-memory rate limiter keyed by client address; responds 429 with Retry-After when exceeded. */
export function rateLimit({ windowMs, max, trustProxy = false }: RateLimitOptions) {
    const windows = new Map<string, Window>();

    setInterval(() => {
        const now = Date.now();
        for (const [key, w] of windows) if (w.resetAt <= now) windows.delete(key);
    }, windowMs).unref();

    return createMiddleware<AppEnv>(async (c, next) => {
        const key = clientKey(c, trustProxy);
        const now = Date.now();

        let current = windows.get(key);
        if (!current || current.resetAt <= now) {
            current = { count: 0, resetAt: now + windowMs };
            windows.set(key, current);
        }
        current.count += 1;

        c.header("RateLimit-Limit", String(max));
        c.header("RateLimit-Remaining", String(Math.max(0, max - current.count)));

        if (current.count > max) {
            const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
            c.header("Retry-After", String(retryAfter));
            throw new RateLimitError(retryAfter);
        }
        await next();
    });
}

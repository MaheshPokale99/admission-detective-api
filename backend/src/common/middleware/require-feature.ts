import { createMiddleware } from "hono/factory";
import type { AppError } from "../errors/app-error.js";
import type { AppEnv } from "../http/app-env.js";

/** Blocks a route with the given error unless its feature is enabled. */
export const requireFeature = (enabled: boolean, error: () => AppError) =>
    createMiddleware<AppEnv>(async (_c, next) => {
        if (!enabled) throw error();
        await next();
    });

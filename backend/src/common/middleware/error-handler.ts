import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { AppError } from "../errors/app-error.js";
import type { AppEnv } from "../http/app-env.js";

interface ErrorBody {
    error: { code: string; message: string; details?: unknown };
    requestId: string | undefined;
}

const body = (code: string, message: string, requestId: string | undefined, details?: unknown): ErrorBody => ({
    error: { code, message, ...(details === undefined ? {} : { details }) },
    requestId,
});

/** Converts every thrown error into the standard `{ error: { code, message, details }, requestId }` response. */
export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
    const requestId = c.get("requestId");
    const logger = c.get("logger");

    if (err instanceof AppError) {
        const log = err.status >= 500 ? logger?.error.bind(logger) : logger?.warn.bind(logger);
        log?.({ err, code: err.code }, err.message);
        return c.json(body(err.code, err.message, requestId, err.details), err.status);
    }

    if (err instanceof HTTPException) {
        logger?.warn({ err, status: err.status }, err.message);
        return c.json(body("HTTP_ERROR", err.message, requestId), err.status);
    }

    logger?.error({ err }, "unhandled error");
    return c.json(body("INTERNAL_ERROR", "Internal server error", requestId), 500);
};

export const notFoundHandler: NotFoundHandler<AppEnv> = (c) =>
    c.json(body("NOT_FOUND", `Route ${c.req.method} ${c.req.path} not found`, c.get("requestId")), 404);

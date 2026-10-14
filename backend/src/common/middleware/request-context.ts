import { randomUUID } from "node:crypto";
import { createMiddleware } from "hono/factory";
import { REQUEST_ID_HEADER } from "../constants.js";
import type { AppEnv } from "../http/app-env.js";
import type { Logger } from "../logger/logger.js";

const VALID_REQUEST_ID = /^[\w-]{8,64}$/;

/** Assigns a request id, exposes a request-scoped logger and logs one line per finished request. */
export const requestContext = (logger: Logger) =>
    createMiddleware<AppEnv>(async (c, next) => {
        const incoming = c.req.header(REQUEST_ID_HEADER);
        const requestId = incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
        const log = logger.child({ requestId });

        c.set("requestId", requestId);
        c.set("logger", log);
        c.header(REQUEST_ID_HEADER, requestId);

        const started = performance.now();
        await next();

        log.info(
            {
                method: c.req.method,
                path: c.req.path,
                status: c.res.status,
                durationMs: Math.round(performance.now() - started),
            },
            "request completed",
        );
    });

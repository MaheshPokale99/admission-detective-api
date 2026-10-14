import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { API_PREFIX, MAX_BODY_BYTES, MS_PER_MINUTE, REQUEST_ID_HEADER } from "./common/constants.js";
import { PayloadTooLargeError } from "./common/errors/app-error.js";
import type { AppEnv } from "./common/http/app-env.js";
import { errorHandler, notFoundHandler } from "./common/middleware/error-handler.js";
import { rateLimit } from "./common/middleware/rate-limit.js";
import { requestContext } from "./common/middleware/request-context.js";
import type { Container } from "./container.js";
import { createProbeRoutes } from "./modules/system/system.routes.js";
import { createV1Routes } from "./routes/v1.js";

/** Builds the HTTP application: cross-cutting middleware, versioned API routes and health probes. */
export function createApp(container: Container) {
    const { config, logger, controllers } = container;
    const app = new Hono<AppEnv>();

    app.use(requestContext(logger));
    app.use(secureHeaders());
    app.use(
        `${API_PREFIX}/*`,
        cors({
            origin: config.corsOrigins,
            exposeHeaders: [REQUEST_ID_HEADER, "RateLimit-Limit", "RateLimit-Remaining", "Retry-After"],
        }),
    );
    app.use(
        `${API_PREFIX}/*`,
        bodyLimit({
            maxSize: MAX_BODY_BYTES,
            onError: () => {
                throw new PayloadTooLargeError();
            },
        }),
    );
    app.use(
        `${API_PREFIX}/*`,
        rateLimit({
            windowMs: MS_PER_MINUTE,
            max: config.rateLimit.perMinute,
            trustProxy: config.rateLimit.trustProxy,
        }),
    );

    app.route(API_PREFIX, createV1Routes(container));
    app.route("/", createProbeRoutes(controllers.system));

    app.notFound(notFoundHandler);
    app.onError(errorHandler);
    return app;
}

import { Hono } from "hono";
import { NotFoundError, ServiceUnavailableError } from "../common/errors/app-error.js";
import type { AppEnv } from "../common/http/app-env.js";
import { MS_PER_MINUTE } from "../common/constants.js";
import { rateLimit } from "../common/middleware/rate-limit.js";
import { requireFeature } from "../common/middleware/require-feature.js";
import type { Container } from "../container.js";
import { createInterventionsRoutes } from "../modules/interventions/interventions.routes.js";
import { createInvestigationsRoutes } from "../modules/investigations/investigations.routes.js";
import { createLeadsRoutes } from "../modules/leads/leads.routes.js";
import { createMetricsRoutes } from "../modules/metrics/metrics.routes.js";
import { createResourcesRoutes } from "../modules/resources/resources.routes.js";
import { createSystemRoutes } from "../modules/system/system.routes.js";

/** All versioned API routes, mounted under /api/v1. */
export function createV1Routes({ config, controllers }: Container) {
    const geminiRequired = requireFeature(
        config.gemini.enabled,
        () => new ServiceUnavailableError("Investigation is not available right now."),
    );
    const demoGuard = requireFeature(config.demo.endpoints, () => new NotFoundError("Not found"));
    const investigateLimit = rateLimit({
        windowMs: MS_PER_MINUTE,
        max: config.rateLimit.investigatePerMinute,
        trustProxy: config.rateLimit.trustProxy,
    });

    return new Hono<AppEnv>()
        .route("/leads", createLeadsRoutes(controllers.leads))
        .route(
            "/leads",
            createInvestigationsRoutes(controllers.investigations, { geminiRequired, rateLimit: investigateLimit }),
        )
        .route("/interventions", createInterventionsRoutes(controllers.interventions, controllers.outcomes))
        .route("/metrics", createMetricsRoutes(controllers.metrics))
        .route("/resources", createResourcesRoutes(controllers.resources))
        .route("/", createSystemRoutes(controllers.system, demoGuard));
}

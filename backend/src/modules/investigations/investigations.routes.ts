import { Hono, type MiddlewareHandler } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import type { InvestigationsController } from "./investigations.controller.js";

export interface InvestigationsRouteGuards {
    geminiRequired: MiddlewareHandler<AppEnv>;
    rateLimit: MiddlewareHandler<AppEnv>;
}

export const createInvestigationsRoutes = (controller: InvestigationsController, guards: InvestigationsRouteGuards) =>
    new Hono<AppEnv>().post("/:id/investigate", guards.rateLimit, guards.geminiRequired, controller.investigate);

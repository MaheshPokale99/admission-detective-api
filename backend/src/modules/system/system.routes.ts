import { Hono, type MiddlewareHandler } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import type { SystemController } from "./system.controller.js";

export const createSystemRoutes = (controller: SystemController, demoGuard: MiddlewareHandler<AppEnv>) =>
    new Hono<AppEnv>().get("/health", controller.status).post("/admin/reset", demoGuard, controller.resetDemoData);

export const createProbeRoutes = (controller: SystemController) =>
    new Hono<AppEnv>().get("/healthz", controller.live).get("/readyz", controller.ready);

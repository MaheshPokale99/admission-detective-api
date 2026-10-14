import { Hono } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import type { MetricsController } from "./metrics.controller.js";

export const createMetricsRoutes = (controller: MetricsController) => new Hono<AppEnv>().get("/", controller.overview);

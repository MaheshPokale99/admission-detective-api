import { Hono } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import type { ResourcesController } from "./resources.controller.js";

export const createResourcesRoutes = (controller: ResourcesController) => new Hono<AppEnv>().get("/", controller.list);

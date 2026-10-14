import { Hono } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import type { LeadsController } from "./leads.controller.js";

export const createLeadsRoutes = (controller: LeadsController) =>
    new Hono<AppEnv>().get("/", controller.list).get("/:id", controller.detail);

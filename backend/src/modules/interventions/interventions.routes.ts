import { Hono } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import type { OutcomesController } from "../outcomes/outcomes.controller.js";
import type { InterventionsController } from "./interventions.controller.js";

export const createInterventionsRoutes = (controller: InterventionsController, outcomes: OutcomesController) =>
    new Hono<AppEnv>()
        .get("/", controller.list)
        .post("/:id/approve", controller.approve)
        .post("/:id/reject", controller.reject)
        .post("/:id/outcomes", outcomes.record);

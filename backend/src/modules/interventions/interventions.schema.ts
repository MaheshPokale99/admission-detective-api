import { z } from "zod";
import { MAX_NOTE_LENGTH, MAX_REVIEWER_LENGTH } from "../../common/constants.js";
import { InterventionStatus } from "./interventions.types.js";

export const listInterventionsQuery = z.object({ status: z.enum(InterventionStatus).optional() });

export const approveInterventionBody = z.object({
    reviewer: z.string().trim().min(1).max(MAX_REVIEWER_LENGTH),
    subject: z.string(),
    body: z.string(),
});

export const rejectInterventionBody = z.object({
    reviewer: z.string().trim().min(1).max(MAX_REVIEWER_LENGTH),
    reason: z.string().trim().max(MAX_NOTE_LENGTH).default(""),
});

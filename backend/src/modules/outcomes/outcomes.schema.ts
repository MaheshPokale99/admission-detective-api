import { z } from "zod";
import { MAX_NOTE_LENGTH } from "../../common/constants.js";
import { OutcomeType } from "./outcomes.types.js";

export const recordOutcomeBody = z.object({
    type: z.enum(OutcomeType),
    note: z.string().trim().max(MAX_NOTE_LENGTH).default(""),
});

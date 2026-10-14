import { OutcomeType } from "../../generated/prisma/enums.js";

export { OutcomeType } from "../../generated/prisma/enums.js";

export const RECOVERED_OUTCOMES: readonly OutcomeType[] = [
    OutcomeType.replied,
    OutcomeType.session_booked,
    OutcomeType.application_resumed,
    OutcomeType.admitted,
];

export interface Outcome {
    id: string;
    interventionId: string;
    leadId: string;
    type: OutcomeType;
    note: string;
    createdAt: string;
}

export interface NewOutcome {
    interventionId: string;
    leadId: string;
    type: OutcomeType;
    note: string;
}

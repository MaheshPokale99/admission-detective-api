import { z } from "zod";
import { ReasonCategory, RecoveryAction } from "../interventions/interventions.types.js";

const evidenceSchema = z.object({
    messageId: z.string().describe("The id of the message in the conversation history, e.g. m_rahul_2"),
    quote: z.string().describe("A short VERBATIM excerpt (max ~25 words) copied from that message"),
});

/** The contract the Detective agent must satisfy when it submits its final answer. */
export const investigationOutputSchema = z.object({
    summary: z.string().describe("2-3 sentence plain-language summary of where this lead stopped and why it matters"),
    stallReasons: z
        .array(
            z.object({
                category: z.enum(ReasonCategory),
                status: z
                    .enum(["confirmed", "possible"])
                    .describe(
                        "confirmed ONLY if the lead (or counsellor note) explicitly states it; otherwise possible",
                    ),
                statement: z.string().describe("One sentence describing the reason"),
                evidence: z
                    .array(evidenceSchema)
                    .describe("Quotes from the conversation. Required for confirmed reasons."),
                reasoning: z
                    .string()
                    .describe("Why the evidence supports this reason, or why it is only a possibility"),
            }),
        )
        .min(1)
        .max(4),
    unmetRequests: z
        .array(
            z.object({
                request: z.string().describe("What the lead asked for that was never delivered"),
                evidence: evidenceSchema,
            }),
        )
        .describe("Things the lead asked for that nobody answered. Empty array if none."),
    recommendation: z.object({
        action: z.enum(RecoveryAction),
        rationale: z.string().describe("Why this is the best next step, referencing the evidence"),
        resourceIds: z
            .array(z.string())
            .describe("ids of verified resources (from search_verified_resources) the message should reference"),
    }),
    draft: z.object({
        subject: z.string(),
        body: z
            .string()
            .describe(
                "Personalised email body in plain text. No URLs (the system appends verified links). Empty string if action is no_action.",
            ),
    }),
    confidence: z.enum(["low", "medium", "high"]),
});

export type InvestigationOutput = z.infer<typeof investigationOutputSchema>;

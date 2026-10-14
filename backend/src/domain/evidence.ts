import type { InvestigationOutput } from "../modules/agent/investigation-output.schema.js";
import type { VerifiedEvidence, VerifiedReason } from "../modules/investigations/investigations.types.js";
import type { Message } from "../modules/messages/messages.types.js";

const normalise = (s: string) =>
    s
        .toLowerCase()
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[^\p{L}\p{N}']+/gu, " ")
        .trim();

/** A quote is verified only if it really appears in the cited message. */
export function verifyEvidence(e: { messageId: string; quote: string }, transcript: Message[]): VerifiedEvidence {
    const message = transcript.find((m) => m.id === e.messageId);
    const quote = normalise(e.quote);
    const verified = !!message && quote.length > 0 && normalise(message.body).includes(quote);
    return { messageId: e.messageId, quote: e.quote, verified };
}

/** Verifies each reason's quotes and downgrades "confirmed" claims that have no verifiable evidence. */
export function verifyReasons(output: InvestigationOutput, transcript: Message[]): VerifiedReason[] {
    return output.stallReasons.map((reason) => {
        const evidence = reason.evidence.map((e) => verifyEvidence(e, transcript));
        const downgraded = reason.status === "confirmed" && !evidence.some((e) => e.verified);
        return {
            category: reason.category,
            status: downgraded ? "possible" : reason.status,
            downgraded,
            statement: reason.statement,
            evidence,
            reasoning: reason.reasoning,
        };
    });
}

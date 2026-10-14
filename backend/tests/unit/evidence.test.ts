import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifyEvidence, verifyReasons } from "../../src/domain/evidence.js";
import type { InvestigationOutput } from "../../src/modules/agent/investigation-output.schema.js";
import { makeMessage } from "../helpers/factories.js";

const transcript = [makeMessage({ id: "m_1", body: "Papa wants to see it “before deciding”, can you send fees?" })];

const output = (reasons: InvestigationOutput["stallReasons"]): InvestigationOutput => ({
    summary: "",
    stallReasons: reasons,
    unmetRequests: [],
    recommendation: { action: "no_action", rationale: "", resourceIds: [] },
    draft: { subject: "", body: "" },
    confidence: "low",
});

describe("verifyEvidence", () => {
    it("accepts a quote that appears in the cited message, ignoring case and punctuation", () => {
        assert.equal(
            verifyEvidence({ messageId: "m_1", quote: "papa wants to see it before deciding" }, transcript).verified,
            true,
        );
    });

    it("rejects a quote that is not in the message", () => {
        assert.equal(
            verifyEvidence({ messageId: "m_1", quote: "I joined another college" }, transcript).verified,
            false,
        );
    });

    it("rejects an unknown message id and an empty quote", () => {
        assert.equal(verifyEvidence({ messageId: "m_99", quote: "Papa wants" }, transcript).verified, false);
        assert.equal(verifyEvidence({ messageId: "m_1", quote: "  " }, transcript).verified, false);
    });
});

describe("verifyReasons", () => {
    const reason = (status: "confirmed" | "possible", quote: string) => ({
        category: "fees" as const,
        status,
        statement: "s",
        evidence: [{ messageId: "m_1", quote }],
        reasoning: "r",
    });

    it("keeps a confirmed reason whose evidence is verified", () => {
        const [result] = verifyReasons(output([reason("confirmed", "can you send fees")]), transcript);
        assert.equal(result!.status, "confirmed");
        assert.equal(result!.downgraded, false);
    });

    it("downgrades a confirmed reason with fabricated evidence to possible", () => {
        const [result] = verifyReasons(output([reason("confirmed", "I will join another college")]), transcript);
        assert.equal(result!.status, "possible");
        assert.equal(result!.downgraded, true);
    });

    it("leaves possible reasons untouched", () => {
        const [result] = verifyReasons(output([reason("possible", "made up")]), transcript);
        assert.equal(result!.status, "possible");
        assert.equal(result!.downgraded, false);
    });
});

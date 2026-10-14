import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isStalled, recoveryScore } from "../../src/domain/stall.js";
import { daysAgo, makeLead, NOW, RULES } from "../helpers/factories.js";

describe("isStalled", () => {
    it("is stalled once silent for the threshold", () => {
        assert.equal(isStalled(makeLead({ lastActivityAt: daysAgo(5) }), RULES, NOW), true);
        assert.equal(isStalled(makeLead({ lastActivityAt: daysAgo(4) }), RULES, NOW), false);
    });

    it("never treats admitted or lost leads as stalled", () => {
        assert.equal(isStalled(makeLead({ stage: "admitted", lastActivityAt: daysAgo(30) }), RULES, NOW), false);
        assert.equal(isStalled(makeLead({ stage: "lost", lastActivityAt: daysAgo(30) }), RULES, NOW), false);
    });
});

describe("recoveryScore", () => {
    it("ranks later funnel stages higher at the same silence", () => {
        const at = (stage: "enquiry" | "applied") =>
            recoveryScore(makeLead({ stage, lastActivityAt: daysAgo(8) }), RULES, NOW);
        assert.ok(at("applied") > at("enquiry"));
    });

    it("is highest 5-14 days after going quiet and fades afterwards", () => {
        const at = (days: number) => recoveryScore(makeLead({ lastActivityAt: daysAgo(days) }), RULES, NOW);
        assert.ok(at(8) > at(30));
        assert.ok(at(8) > at(2));
    });

    it("is bounded between 0 and 100", () => {
        for (const stage of ["enquiry", "counselled", "shortlisted", "applied"] as const) {
            const score = recoveryScore(makeLead({ stage, lastActivityAt: daysAgo(9) }), RULES, NOW);
            assert.ok(score >= 0 && score <= 100);
        }
    });
});

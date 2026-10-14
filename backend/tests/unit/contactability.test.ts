import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkContactability } from "../../src/domain/contactability.js";
import { daysAgo, makeLead, NOW, RULES } from "../helpers/factories.js";

describe("checkContactability", () => {
    it("allows an opted-in, eligible, active lead", () => {
        assert.deepEqual(checkContactability(makeLead(), undefined, RULES, NOW), { ok: true, reasons: [] });
    });

    it("blocks opted-out leads", () => {
        const result = checkContactability(makeLead({ consent: "opted_out" }), undefined, RULES, NOW);
        assert.equal(result.ok, false);
        assert.match(result.reasons[0]!, /opted out/);
    });

    it("blocks leads with no consent on record", () => {
        const result = checkContactability(makeLead({ consent: "unknown" }), undefined, RULES, NOW);
        assert.match(result.reasons[0]!, /No communication consent/);
    });

    it("blocks ineligible leads and explains why", () => {
        const lead = makeLead({ eligibility: "ineligible", ineligibleReason: "No Mathematics" });
        assert.match(checkContactability(lead, undefined, RULES, NOW).reasons[0]!, /Ineligible: No Mathematics/);
    });

    it("blocks admitted and lost leads", () => {
        for (const stage of ["admitted", "lost"] as const) {
            assert.equal(checkContactability(makeLead({ stage }), undefined, RULES, NOW).ok, false);
        }
    });

    it("enforces the cooldown after a send, and releases it afterwards", () => {
        assert.equal(checkContactability(makeLead(), daysAgo(1), RULES, NOW).ok, false);
        assert.equal(checkContactability(makeLead(), daysAgo(3), RULES, NOW).ok, true);
    });

    it("reports every reason at once", () => {
        const lead = makeLead({ consent: "opted_out", eligibility: "ineligible", email: "" });
        assert.equal(checkContactability(lead, undefined, RULES, NOW).reasons.length, 3);
    });
});

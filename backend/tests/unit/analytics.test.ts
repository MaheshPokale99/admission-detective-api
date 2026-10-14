import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buckets, percent, timeline, totals } from "../../src/modules/metrics/analytics.js";
import { daysAgo, makeIntervention, makeOutcome, NOW } from "../helpers/factories.js";

const rows = [
    makeIntervention({
        id: "a",
        outcomes: [makeOutcome({ type: "replied" }), makeOutcome({ id: "o2", type: "admitted" })],
    }),
    makeIntervention({ id: "b", edited: true, outcomes: [makeOutcome({ type: "no_response" })] }),
    makeIntervention({
        id: "c",
        action: "offer_parent_session",
        primaryCategory: "parent_approval",
        outcomes: [makeOutcome({ type: "session_booked" })],
    }),
    makeIntervention({ id: "d", status: "rejected", sentAt: null }),
    makeIntervention({ id: "e", status: "pending_approval", sentAt: null }),
];

describe("percent", () => {
    it("rounds and guards division by zero", () => {
        assert.equal(percent(1, 3), 33);
        assert.equal(percent(0, 0), 0);
    });
});

describe("totals", () => {
    it("counts sent, recovered, admitted, edited, rejected and pending", () => {
        assert.deepEqual(totals(rows), { sent: 3, rejected: 1, pending: 1, edited: 1, recovered: 2, admitted: 1 });
    });
});

describe("buckets", () => {
    it("groups sent interventions by action with recovery rates", () => {
        const byAction = buckets(rows, "action");
        const fee = byAction.find((b) => b.key === "send_fee_resource")!;
        assert.deepEqual([fee.sent, fee.recovered, fee.admitted, fee.recoveryRate], [2, 1, 1, 50]);
        assert.equal(byAction[0]!.key, "send_fee_resource", "most used first");
    });

    it("groups by reason and filters by category", () => {
        assert.deepEqual(
            buckets(rows, "reason").map((b) => b.key),
            ["fees", "parent_approval"],
        );
        assert.deepEqual(
            buckets(rows, "action", "parent_approval").map((b) => b.key),
            ["offer_parent_session"],
        );
    });
});

describe("timeline", () => {
    it("returns one point per day, ending today", () => {
        const points = timeline(rows, 14, new Date(NOW));
        assert.equal(points.length, 14);
        assert.equal(points.at(-1)!.date, new Date(NOW).toLocaleDateString("en-CA"));
    });

    it("counts sends and recoveries on the right day", () => {
        const points = timeline(
            [makeIntervention({ sentAt: daysAgo(2), outcomes: [makeOutcome({ createdAt: daysAgo(1) })] })],
            5,
            new Date(NOW),
        );
        assert.equal(
            points.reduce((n, p) => n + p.sent, 0),
            1,
        );
        assert.equal(
            points.reduce((n, p) => n + p.recovered, 0),
            1,
        );
        assert.equal(points.at(-3)!.sent, 1);
        assert.equal(points.at(-2)!.recovered, 1);
    });
});

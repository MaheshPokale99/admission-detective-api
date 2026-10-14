import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { GenerateFn } from "../../src/modules/agent/agent.types.js";
import { call, callSse } from "../helpers/http.js";
import {
    createTestStack,
    fullInvestigation,
    rahulSubmission,
    scriptedModel,
    simpleSubmission,
    type TestStack,
} from "../helpers/test-stack.js";

const V1 = "/api/v1";

let stack: TestStack;
let model: GenerateFn = () => Promise.reject(new Error("no model scripted"));
const useModel = (turns: Parameters<typeof scriptedModel>[0]) => {
    const scripted = scriptedModel(turns);
    model = scripted.generate;
    return scripted;
};

const rejectAllPending = async () => {
    const { body: pending } = await call<any[]>(stack.app, "GET", `${V1}/interventions?status=pending_approval`);
    for (const i of pending) {
        await call(stack.app, "POST", `${V1}/interventions/${i.id}/reject`, { reviewer: "t", reason: "reset" });
    }
};

const investigate = (leadId: string) => callSse(stack.app, `${V1}/leads/${leadId}/investigate`);
const interventionOf = (events: Awaited<ReturnType<typeof investigate>>["events"]) =>
    events.find((e) => e.event === "result")!.data.intervention;

describe("API", () => {
    before(async () => {
        stack = await createTestStack(
            { INVESTIGATE_RATE_LIMIT_PER_MINUTE: "1000" },
            { generate: (contents) => model(contents) },
        );
    });
    after(() => stack.stop());

    describe("platform behaviour", () => {
        it("serves liveness and readiness probes", async () => {
            assert.equal((await call(stack.app, "GET", "/healthz")).status, 200);
            const ready = await call(stack.app, "GET", "/readyz");
            assert.deepEqual(ready.body, { status: "ready" });
        });

        it("reports configuration status", async () => {
            const { body } = await call(stack.app, "GET", `${V1}/health`);
            assert.equal(body.ok, true);
            assert.equal(body.gemini.configured, true);
            assert.equal(body.email, "simulated");
            assert.equal(body.demoEndpoints, true);
        });

        it("echoes a valid request id and generates one otherwise", async () => {
            const sent = await call(stack.app, "GET", `${V1}/health`, undefined, { "x-request-id": "trace-12345678" });
            assert.equal(sent.headers.get("x-request-id"), "trace-12345678");
            const generated = await call(stack.app, "GET", `${V1}/health`);
            assert.match(generated.headers.get("x-request-id")!, /^[0-9a-f-]{36}$/);
        });

        it("answers errors in the standard envelope", async () => {
            const missing = await call(stack.app, "GET", `${V1}/leads/nope`);
            assert.equal(missing.status, 404);
            assert.equal(missing.body.error.code, "NOT_FOUND");
            assert.ok(missing.body.requestId);

            const unknownRoute = await call(stack.app, "GET", `${V1}/does-not-exist`);
            assert.equal(unknownRoute.status, 404);
            assert.equal(unknownRoute.body.error.code, "NOT_FOUND");
        });

        it("validates request bodies and query strings", async () => {
            const bad = await call(stack.app, "POST", `${V1}/interventions/x/reject`, {});
            assert.equal(bad.status, 422);
            assert.equal(bad.body.error.code, "VALIDATION_ERROR");
            assert.equal(bad.body.error.details[0].path, "reviewer");

            const malformed = await call(stack.app, "POST", `${V1}/interventions/x/reject`, "{not json");
            assert.equal(malformed.status, 422);

            assert.equal((await call(stack.app, "GET", `${V1}/interventions?status=bogus`)).status, 422);
        });

        it("rejects oversized bodies", async () => {
            const huge = await call(stack.app, "POST", `${V1}/interventions/x/reject`, {
                reviewer: "a",
                reason: "x".repeat(200_000),
            });
            assert.equal(huge.status, 413);
            assert.equal(huge.body.error.code, "PAYLOAD_TOO_LARGE");
        });

        it("hides the demo reset endpoint when demo endpoints are disabled", async () => {
            const { app } = stack.createApp({ ENABLE_DEMO_ENDPOINTS: "false" });
            assert.equal((await call(app, "POST", `${V1}/admin/reset`)).status, 404);
            assert.equal((await call(app, "GET", `${V1}/health`)).body.demoEndpoints, false);
        });

        it("rate limits the investigate endpoint", async () => {
            const { app } = stack.createApp({ INVESTIGATE_RATE_LIMIT_PER_MINUTE: "1" });
            const first = await app.request(`${V1}/leads/lead_priya/investigate`, { method: "POST" });
            assert.equal(first.status, 409);
            const second = await app.request(`${V1}/leads/lead_priya/investigate`, { method: "POST" });
            assert.equal(second.status, 429);
            assert.ok(Number(second.headers.get("Retry-After")) >= 1);
        });

        it("refuses to investigate when Gemini is not configured", async () => {
            const { app } = stack.createApp({ GEMINI_API_KEY: "" });
            const res = await app.request(`${V1}/leads/lead_rahul/investigate`, { method: "POST" });
            assert.equal(res.status, 503);
        });
    });

    describe("lead intelligence", () => {
        it("detects stalled leads and separates protected ones", async () => {
            const { body: leads } = await call<any[]>(stack.app, "GET", `${V1}/leads`);
            const byId = Object.fromEntries(leads.map((l) => [l.id, l]));
            assert.equal(byId.lead_rahul.status, "ready");
            assert.equal(byId.lead_mahesh.name, "Mahesh Pokale");
            assert.equal(byId.lead_mahesh.email, "maheshpokale740@gmail.com");
            assert.equal(byId.lead_mahesh.status, "ready", "the real-inbox test lead can be investigated");
            assert.equal(byId.lead_ishita.stalled, false);
            for (const id of ["lead_priya", "lead_arjunm", "lead_rohan"]) {
                assert.equal(byId[id].status, "protected");
                assert.ok(byId[id].protectedReasons.length > 0);
            }
        });

        it("returns a complete case file", async () => {
            const { body } = await call(stack.app, "GET", `${V1}/leads/lead_rahul`);
            assert.equal(body.messages.length, 3);
            assert.deepEqual(Object.keys(body).sort(), [
                "audit",
                "interventions",
                "investigations",
                "lead",
                "messages",
            ]);
        });
    });

    describe("recovery workflow", () => {
        it("never investigates an opted-out, ineligible or no-consent lead", async () => {
            const scripted = useModel(fullInvestigation(rahulSubmission()));
            for (const id of ["lead_priya", "lead_arjunm", "lead_rohan"]) {
                const res = await investigate(id);
                assert.equal(res.status, 409);
                assert.equal(res.body.error.code, "CONFLICT");
                assert.ok(res.body.error.details.reasons.length > 0);
            }
            assert.equal(scripted.seen.length, 0, "the model must not even be called");
        });

        it("runs the agent, verifies evidence and stores a pending draft", async () => {
            useModel(fullInvestigation(rahulSubmission()));
            const { status, events } = await investigate("lead_rahul");
            assert.equal(status, 200);

            assert.deepEqual(
                events.filter((e) => e.event === "step").map((e) => e.data.tool),
                [
                    "get_lead_profile",
                    "get_conversation_history",
                    "search_verified_resources",
                    "get_past_intervention_results",
                    "submit_investigation",
                ],
            );

            const { investigation, intervention } = events.find((e) => e.event === "result")!.data;
            const [real, fake] = investigation.result.stallReasons;
            assert.equal(real.status, "confirmed");
            assert.equal(real.evidence[0].verified, true);
            assert.equal(fake.status, "possible", "fabricated quote must be downgraded");
            assert.equal(fake.downgraded, true);

            assert.equal(intervention.status, "pending_approval");
            assert.equal(intervention.primaryCategory, "parent_approval");
            assert.deepEqual(intervention.resourceIds, ["res_fees", "res_emi"]);
            assert.match(intervention.draftBody, /https:\/\/admissions\.niat\.example\/fees/);
            assert.ok(
                intervention.warnings.some((w: string) => w.includes("90%")),
                "unverified figure flagged",
            );
            assert.ok(!intervention.warnings.some((w: string) => w.includes("2,40,000")));
        });

        it("allows only one pending draft per lead", async () => {
            const res = await investigate("lead_rahul");
            assert.equal(res.status, 409);
            assert.match(res.body.error.message, /already waiting/);
        });

        it("does not leak other leads' data to the agent", async () => {
            await rejectAllPending();

            const scripted = useModel(fullInvestigation(rahulSubmission()));
            await investigate("lead_rahul");
            const lastTurn = JSON.stringify(scripted.seen.at(-1));
            assert.ok(!lastTurn.includes("Priya") && !lastTurn.includes("Ananya"));
        });

        it("makes the agent read the conversation before submitting", async () => {
            await rejectAllPending();

            const scripted = useModel([
                [{ name: "submit_investigation", args: rahulSubmission() }],
                [{ name: "get_conversation_history", args: {} }],
                [{ name: "submit_investigation", args: rahulSubmission() }],
            ]);
            const { events } = await investigate("lead_rahul");
            assert.equal(events.find((e) => e.event === "result")!.data.investigation.trace.length, 2);
            assert.match(JSON.stringify(scripted.seen[1]), /Read the conversation/);
        });

        it("sends exactly the approved (edited) text and records it", async () => {
            const { body: pending } = await call<any[]>(
                stack.app,
                "GET",
                `${V1}/interventions?status=pending_approval`,
            );
            const id = pending.find((i) => i.leadId === "lead_rahul").id;

            const approve = (text = "Hi Rahul, edited by Neha.") =>
                call(stack.app, "POST", `${V1}/interventions/${id}/approve`, {
                    reviewer: "Neha Kapoor",
                    subject: "Fee details for you and your parents",
                    body: text,
                });

            const sent = await approve();
            assert.equal(sent.status, 200);
            assert.equal(sent.body.status, "sent");
            assert.equal(sent.body.edited, true);
            assert.equal(sent.body.finalBody, "Hi Rahul, edited by Neha.");
            assert.equal(sent.body.provider, "simulated");

            const { body: detail } = await call(stack.app, "GET", `${V1}/leads/lead_rahul`);
            assert.ok(
                detail.messages.some((m: any) => m.direction === "outbound" && m.body.includes("edited by Neha")),
            );

            const again = await approve();
            assert.equal(again.status, 409, "cannot send twice");
        });

        it("sends only once when two approvals race", async () => {
            useModel([
                [{ name: "get_conversation_history", args: {} }],
                [{ name: "submit_investigation", args: simpleSubmission() }],
            ]);
            const intervention = interventionOf((await investigate("lead_faizan")).events);

            const approve = (reviewer: string) =>
                call(stack.app, "POST", `${V1}/interventions/${intervention.id}/approve`, {
                    reviewer,
                    subject: "s",
                    body: "b",
                });
            const results = await Promise.all([approve("A"), approve("B")]);

            assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
            const { body: detail } = await call(stack.app, "GET", `${V1}/leads/lead_faizan`);
            assert.equal(detail.messages.filter((m: any) => m.direction === "outbound").length, 1);
        });

        it("respects the cooldown after a send", async () => {
            const res = await investigate("lead_rahul");
            assert.equal(res.status, 409);
            assert.match(res.body.error.details.reasons[0], /cooldown/);
        });

        it("re-checks consent at send time", async () => {
            useModel([
                [{ name: "get_conversation_history", args: {} }],
                [{ name: "submit_investigation", args: simpleSubmission() }],
            ]);
            const intervention = interventionOf((await investigate("lead_ananya")).events);
            await stack.container.repositories.leads.updateConsent("lead_ananya", "opted_out", "Replied STOP");

            const res = await call(stack.app, "POST", `${V1}/interventions/${intervention.id}/approve`, {
                reviewer: "Neha Kapoor",
                subject: "s",
                body: "b",
            });
            assert.equal(res.status, 409);

            const { body: all } = await call<any[]>(stack.app, "GET", `${V1}/interventions?status=failed`);
            const failed = all.find((i) => i.id === intervention.id);
            assert.ok(failed, "draft is marked failed");
            assert.equal(failed.finalBody, null, "nothing was approved or sent");
        });

        it("tracks outcomes and surfaces them in the metrics", async () => {
            const { body: sentList } = await call<any[]>(stack.app, "GET", `${V1}/interventions?status=sent`);
            const id = sentList.find((i) => i.leadId === "lead_rahul").id;

            for (const [type, note] of [
                ["replied", "Father replied asking for a call"],
                ["session_booked", "Parent session booked"],
            ]) {
                assert.equal(
                    (await call(stack.app, "POST", `${V1}/interventions/${id}/outcomes`, { type, note })).status,
                    200,
                );
            }
            const { body: leads } = await call<any[]>(stack.app, "GET", `${V1}/leads`);
            assert.equal(leads.find((l) => l.id === "lead_rahul").status, "recovered");

            const { body: metrics } = await call(stack.app, "GET", `${V1}/metrics`);
            assert.equal(metrics.totals.sent, 10 + 2, "10 historical sends + Rahul + Faizan");
            assert.ok(metrics.totals.recovered >= 1);
            assert.ok(metrics.byAction.some((a: any) => a.key === "send_fee_resource"));
            assert.ok(metrics.safety.protectedStalled >= 3);
            assert.equal(metrics.timeline.length, 14);
        });

        it("rejects outcomes for messages that were never sent", async () => {
            const { body: failed } = await call<any[]>(stack.app, "GET", `${V1}/interventions?status=failed`);
            const res = await call(stack.app, "POST", `${V1}/interventions/${failed[0].id}/outcomes`, {
                type: "replied",
            });
            assert.equal(res.status, 409);
        });

        it("produces no draft when the agent recommends no action", async () => {
            useModel([
                [{ name: "get_conversation_history", args: {} }],
                [
                    {
                        name: "submit_investigation",
                        args: rahulSubmission({
                            recommendation: { action: "no_action", rationale: "r", resourceIds: [] },
                            draft: { subject: "", body: "" },
                        }),
                    },
                ],
            ]);
            const { events } = await investigate("lead_karthik");
            assert.equal(interventionOf(events), null);
        });

        it("reports a clean error event when the model gives up", async () => {
            useModel([[], [], [], []]);
            const { events } = await investigate("lead_sneha");
            const error = events.find((e) => e.event === "error")!.data.error;
            assert.equal(error.code, "UPSTREAM_ERROR");
        });

        it("reloads the demo data on reset", async () => {
            assert.equal((await call(stack.app, "POST", `${V1}/admin/reset`)).status, 200);
            const { body: metrics } = await call(stack.app, "GET", `${V1}/metrics`);
            assert.equal(metrics.totals.sent, 10);
        });
    });
});

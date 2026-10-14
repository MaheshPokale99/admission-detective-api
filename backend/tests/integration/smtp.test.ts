import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { SMTPServer } from "smtp-server";
import { loadConfig } from "../../src/config/env.js";
import { createEmailSender, SmtpEmailSender } from "../../src/integrations/email/email-sender.js";
import { call, callSse } from "../helpers/http.js";
import {
    createTestStack,
    fullInvestigation,
    rahulSubmission,
    scriptedModel,
    type TestStack,
} from "../helpers/test-stack.js";

interface CapturedMail {
    from: string;
    to: string[];
    raw: string;
}

const USER = "counsellor@example.test";
const PASS = "app-password";

let smtp: SMTPServer;
let port = 0;
const inbox: CapturedMail[] = [];

const startSmtp = () =>
    new Promise<void>((resolve) => {
        smtp = new SMTPServer({
            authOptional: false,
            allowInsecureAuth: true,
            disabledCommands: ["STARTTLS"],
            onAuth: (auth, _session, done) =>
                auth.username === USER && auth.password === PASS
                    ? done(null, { user: auth.username })
                    : done(new Error("Invalid credentials")),
            onData: (stream, session, done) => {
                const chunks: Buffer[] = [];
                stream.on("data", (c: Buffer) => chunks.push(c));
                stream.on("end", () => {
                    inbox.push({
                        from: session.envelope.mailFrom ? session.envelope.mailFrom.address : "",
                        to: session.envelope.rcptTo.map((r) => r.address),
                        raw: Buffer.concat(chunks).toString("utf8"),
                    });
                    done();
                });
            },
        });
        smtp.listen(0, "127.0.0.1", () => {
            port = (smtp.server.address() as { port: number }).port;
            resolve();
        });
    });

const smtpEnv = (overrides: Record<string, string> = {}) => ({
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(port),
    SMTP_USER: USER,
    SMTP_PASS: PASS,
    ...overrides,
});

describe("SMTP email", () => {
    before(startSmtp);
    after(() => new Promise<void>((resolve) => smtp.close(() => resolve())));

    describe("configuration", () => {
        it("uses SMTP automatically when SMTP_HOST is set, with the SMTP user as sender", () => {
            const { email } = loadConfig({ SMTP_HOST: "smtp.gmail.com", SMTP_USER: "me@gmail.com", SMTP_PASS: "x" });
            assert.equal(email.provider, "smtp");
            assert.equal(email.from, "NIAT Admissions <me@gmail.com>");
            assert.equal(email.smtp.port, 587);
            assert.equal(email.smtp.secure, false);
        });

        it("turns on implicit TLS for port 465", () => {
            const { email } = loadConfig({
                SMTP_HOST: "smtp.gmail.com",
                SMTP_PORT: "465",
                SMTP_USER: "a",
                SMTP_PASS: "b",
            });
            assert.equal(email.smtp.secure, true);
        });

        it("falls back to Resend, then to simulated", () => {
            assert.equal(loadConfig({ RESEND_API_KEY: "re_key" }).email.provider, "resend");
            assert.equal(loadConfig({}).email.provider, "simulated");
        });

        it("lets EMAIL_PROVIDER override auto-detection", () => {
            const { email } = loadConfig({ EMAIL_PROVIDER: "simulated", ...smtpEnv() });
            assert.equal(email.provider, "simulated");
        });

        it("fails fast when SMTP is selected but incomplete", () => {
            assert.throws(() => loadConfig({ SMTP_HOST: "smtp.gmail.com" }), /requires SMTP_USER, SMTP_PASS/);
            assert.throws(() => loadConfig({ EMAIL_PROVIDER: "resend" }), /requires RESEND_API_KEY/);
        });
    });

    describe("sender", () => {
        const config = () => loadConfig(smtpEnv()).email;

        it("delivers the exact subject and body to the recipient", async () => {
            const sender = createEmailSender(config());
            const result = await sender.send("rahul@example.com", "Fee details", "Hi Rahul,\n\nHere is the breakup.");

            assert.equal(result.provider, "smtp");
            assert.ok(result.messageId);
            const mail = inbox.at(-1)!;
            assert.deepEqual(mail.to, ["rahul@example.com"]);
            assert.equal(mail.from, USER);
            assert.match(mail.raw, /Subject: Fee details/);
            assert.match(mail.raw, /Here is the breakup\./);
        });

        it("verifies a working connection", async () => {
            await assert.doesNotReject(() => createEmailSender(config()).verify!());
        });

        it("reports bad credentials instead of pretending to send", async () => {
            const bad = new SmtpEmailSender(loadConfig(smtpEnv({ SMTP_PASS: "wrong" })).email.smtp, USER);
            await assert.rejects(() => bad.send("a@example.com", "s", "b"), /Invalid credentials|auth/i);
            await assert.rejects(() => bad.verify());
        });

        it("fails clearly when the server is unreachable", async () => {
            const down = new SmtpEmailSender(
                { host: "127.0.0.1", port: 1, secure: false, user: USER, pass: PASS },
                USER,
            );
            await assert.rejects(() => down.send("a@example.com", "s", "b"));
        });
    });

    describe("approval flow over SMTP", () => {
        let stack: TestStack;
        let model = scriptedModel([]).generate;

        before(async () => {
            stack = await createTestStack(smtpEnv({ INVESTIGATE_RATE_LIMIT_PER_MINUTE: "1000" }), {
                generate: (contents) => model(contents),
            });
        });
        after(() => stack.stop());

        it("sends the counsellor-approved text through SMTP and records the provider", async () => {
            model = scriptedModel(fullInvestigation(rahulSubmission())).generate;
            const { events } = await callSse(stack.app, "/api/v1/leads/lead_rahul/investigate");
            const intervention = events.find((e) => e.event === "result")!.data.intervention;

            const res = await call(stack.app, "POST", `/api/v1/interventions/${intervention.id}/approve`, {
                reviewer: "Neha Kapoor",
                subject: "Fee details for you and your parents",
                body: "Hi Rahul, approved and edited by Neha.",
            });

            assert.equal(res.status, 200);
            assert.equal(res.body.status, "sent");
            assert.equal(res.body.provider, "smtp");

            const mail = inbox.at(-1)!;
            assert.deepEqual(mail.to, ["rahul.verma@example.com"]);
            assert.match(mail.raw, /Subject: Fee details for you and your parents/);
            assert.match(mail.raw, /approved and edited by Neha\./);
        });

        it("marks the draft failed, and retryable, when SMTP delivery fails", async () => {
            const broken = stack.createApp(smtpEnv({ SMTP_PASS: "wrong" }), {
                generate: scriptedModel(fullInvestigation(rahulSubmission())).generate,
            });
            await stack.reseed();
            const { events } = await callSse(broken.app, "/api/v1/leads/lead_rahul/investigate");
            const intervention = events.find((e) => e.event === "result")!.data.intervention;

            const res = await call(broken.app, "POST", `/api/v1/interventions/${intervention.id}/approve`, {
                reviewer: "Neha Kapoor",
                subject: "s",
                body: "b",
            });
            assert.equal(res.status, 502, "a failed delivery is an error response, not 200");
            assert.equal(res.body.error.code, "EMAIL_DELIVERY_FAILED");
            assert.ok(!/credentials|auth|smtp/i.test(res.body.error.message), "no provider details reach the client");

            const failed = await call<any[]>(broken.app, "GET", "/api/v1/interventions?status=failed");
            const stored = failed.body.find((i) => i.id === intervention.id);
            assert.ok(stored, "the draft is kept as failed so it can be retried");
            assert.match(stored.error, /Invalid credentials|auth/i, "the real reason is stored for the administrator");

            const detail = await call(broken.app, "GET", "/api/v1/leads/lead_rahul");
            assert.ok(
                detail.body.messages.every((m: any) => m.direction !== "outbound"),
                "nothing is recorded as sent",
            );
            assert.ok(detail.body.audit.some((a: any) => a.action === "send_failed"));

            const retry = await call(stack.app, "POST", `/api/v1/interventions/${intervention.id}/approve`, {
                reviewer: "Neha Kapoor",
                subject: "s",
                body: "b",
            });
            assert.equal(retry.body.status, "sent");
            assert.equal(retry.body.provider, "smtp");
        });
    });
});

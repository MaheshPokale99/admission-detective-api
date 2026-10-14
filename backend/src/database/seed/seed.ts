import { InterventionStatus, MessageChannel } from "../../generated/prisma/enums.js";
import type { Database } from "../database.js";
import { ago, HISTORY, LEADS, RESOURCES, type LeadSeed } from "./seed-data.js";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, ".");
const DEMO_PROGRAM = LEADS[0]!.program;

const leadRow = (s: LeadSeed, index: number, now: number) => ({
    id: `lead_${s.key}`,
    name: s.name,
    email: s.email ?? `${slug(s.name)}@example.com`,
    phone: `+91 90000 000${10 + index}`,
    city: s.city,
    program: s.program,
    stage: s.stage,
    consent: s.consent ?? "opted_in",
    consentNote: s.consentNote ?? "Consented on enquiry form",
    eligibility: s.eligibility ?? "eligible",
    ineligibleReason: s.ineligibleReason ?? "",
    counsellor: s.counsellor,
    source: s.source,
    createdAt: new Date(ago(s.createdDaysAgo, 9, now)),
    lastActivityAt: new Date(ago(s.lastActivityDaysAgo, 12, now)),
});

const messageRows = (s: LeadSeed, now: number) =>
    s.messages.map(([channel, direction, author, body, daysAgo, hour], i) => ({
        id: `m_${s.key}_${i + 1}`,
        leadId: `lead_${s.key}`,
        channel,
        direction,
        author,
        body,
        sentAt: new Date(ago(daysAgo, hour ?? 12, now)),
    }));

/** Adds only the sample leads that are not in the database yet (matched by id) and leaves everything else alone. */
export async function seedMissingLeads(database: Database): Promise<string[]> {
    const now = Date.now();
    return database.transaction(async () => {
        const db = database.client;
        const existing = new Set((await db.lead.findMany({ select: { id: true } })).map((l) => l.id));
        const missing = LEADS.map((s, index) => ({ s, index })).filter(({ s }) => !existing.has(`lead_${s.key}`));
        if (missing.length === 0) return [];

        await db.lead.createMany({ data: missing.map(({ s, index }) => leadRow(s, index, now)) });
        await db.message.createMany({ data: missing.flatMap(({ s }) => messageRows(s, now)) });
        return missing.map(({ s }) => s.name);
    });
}

/** Deletes every row, children first. */
async function resetAllData(database: Database): Promise<void> {
    const db = database.client;
    await db.auditLog.deleteMany();
    await db.outcome.deleteMany();
    await db.intervention.deleteMany();
    await db.investigation.deleteMany();
    await db.resource.deleteMany();
    await db.message.deleteMany();
    await db.lead.deleteMany();
}

/** Loads the demo dataset in one transaction; with `reset` it first empties every table. */
export async function seedDatabase(database: Database, options: { reset: boolean }): Promise<void> {
    const now = Date.now();

    await database.transaction(async () => {
        if (options.reset) await resetAllData(database);
        const db = database.client;

        await db.resource.createMany({
            data: RESOURCES(now).map((r) => ({ ...r, verifiedAt: new Date(r.verifiedAt) })),
        });

        await db.lead.createMany({ data: LEADS.map((s, index) => leadRow(s, index, now)) });
        await db.message.createMany({ data: LEADS.flatMap((s) => messageRows(s, now)) });

        await db.lead.createMany({
            data: HISTORY.map((h, index) => ({
                id: `lead_${h.key}`,
                name: h.name,
                email: `${slug(h.name)}@example.com`,
                program: DEMO_PROGRAM,
                stage: h.stage,
                consent: "opted_in" as const,
                consentNote: "Consented on enquiry form",
                eligibility: "eligible" as const,
                counsellor: "Neha Kapoor",
                source: "Website enquiry form",
                createdAt: new Date(ago(h.sentDaysAgo + 12, 9, now)),
                lastActivityAt: new Date(ago(1 + (index % 3), 12, now)),
            })),
        });

        await db.intervention.createMany({
            data: HISTORY.map((h) => {
                const sent = h.status !== "rejected";
                return {
                    id: `int_${h.key}`,
                    leadId: `lead_${h.key}`,
                    channel: MessageChannel.email,
                    status: sent ? InterventionStatus.sent : InterventionStatus.rejected,
                    action: h.action,
                    primaryCategory: h.category,
                    draftSubject: h.subject,
                    draftBody: h.body,
                    finalSubject: sent ? h.subject : null,
                    finalBody: sent ? h.body : null,
                    edited: h.edited ?? false,
                    reviewedBy: "Neha Kapoor",
                    reviewedAt: new Date(ago(h.sentDaysAgo, 10, now)),
                    rejectionReason: sent ? null : "Too generic, will call personally",
                    sentAt: sent ? new Date(ago(h.sentDaysAgo, 11, now)) : null,
                    provider: sent ? "simulated" : null,
                    createdAt: new Date(ago(h.sentDaysAgo + 1, 10, now)),
                };
            }),
        });

        await db.outcome.createMany({
            data: HISTORY.flatMap((h) =>
                h.outcomes.map(([type, note], i) => ({
                    id: `out_${h.key}_${i + 1}`,
                    interventionId: `int_${h.key}`,
                    leadId: `lead_${h.key}`,
                    type,
                    note,
                    createdAt: new Date(ago(Math.max(0, h.sentDaysAgo - 1 - i), 14, now)),
                })),
            ),
        });

        await db.auditLog.createMany({
            data: HISTORY.map((h) => ({
                leadId: `lead_${h.key}`,
                interventionId: `int_${h.key}`,
                actor: "Neha Kapoor",
                action: h.status === "rejected" ? "rejected" : "sent",
                createdAt: new Date(ago(h.sentDaysAgo, 11, now)),
            })),
        });
    });
}

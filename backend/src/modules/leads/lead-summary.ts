import { MESSAGE_PREVIEW_LENGTH } from "../../common/constants.js";
import { daysSince } from "../../common/utils/time.js";
import type { BusinessRules } from "../../domain/business-rules.js";
import { checkContactability } from "../../domain/contactability.js";
import { isStalled, recoveryScore } from "../../domain/stall.js";
import { InterventionStatus, type InterventionWithOutcomes } from "../interventions/interventions.types.js";
import type { Message } from "../messages/messages.types.js";
import { RECOVERED_OUTCOMES } from "../outcomes/outcomes.types.js";
import { LeadStage, type Lead, type LeadStatus, type LeadSummary } from "./leads.types.js";

export interface SummaryContext {
    lastMessage: Map<string, Message>;
    interventions: Map<string, InterventionWithOutcomes[]>;
    investigated: Set<string>;
}

function statusOf(
    lead: Lead,
    flags: { stalled: boolean; contactable: boolean; pending: boolean; contacted: boolean; recovered: boolean },
): LeadStatus {
    if (lead.stage === LeadStage.admitted || lead.stage === LeadStage.lost) return "closed";
    if (flags.pending) return "awaiting_approval";
    if (flags.contacted) return "contacted";
    if (flags.recovered && !flags.stalled) return "recovered";
    if (!flags.stalled) return "active";
    return flags.contactable ? "ready" : "protected";
}

/** Combines a lead with its messages, interventions and rules into the view the UI shows. */
export function buildLeadSummary(lead: Lead, ctx: SummaryContext, rules: BusinessRules, now = Date.now()): LeadSummary {
    const interventions = ctx.interventions.get(lead.id) ?? [];
    const pending = interventions.find((i) => i.status === InterventionStatus.pending_approval);
    const lastSent = interventions.find((i) => i.status === InterventionStatus.sent);
    const lastSentAt = interventions
        .flatMap((i) => (i.status === InterventionStatus.sent && i.sentAt ? [i.sentAt] : []))
        .sort()
        .at(-1);

    const stalled = isStalled(lead, rules, now);
    const contact = checkContactability(lead, lastSentAt, rules, now);
    const last = ctx.lastMessage.get(lead.id);

    return {
        ...lead,
        daysInactive: daysSince(lead.lastActivityAt, now),
        stalled,
        recoveryScore: stalled ? recoveryScore(lead, rules, now) : 0,
        status: statusOf(lead, {
            stalled,
            contactable: contact.ok,
            pending: !!pending,
            contacted: !!lastSent && lastSent.outcomes.length === 0,
            recovered: !!lastSent?.outcomes.some((o) => RECOVERED_OUTCOMES.includes(o.type)),
        }),
        contactable: contact.ok,
        protectedReasons: contact.reasons,
        investigated: ctx.investigated.has(lead.id),
        pendingInterventionId: pending?.id ?? null,
        lastMessage: last
            ? { channel: last.channel, direction: last.direction, preview: last.body.slice(0, MESSAGE_PREVIEW_LENGTH) }
            : null,
    };
}

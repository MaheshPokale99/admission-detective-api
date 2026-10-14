import { daysSince } from "../common/utils/time.js";
import { TERMINAL_STAGES, Consent, Eligibility, type Lead } from "../modules/leads/leads.types.js";
import type { BusinessRules } from "./business-rules.js";

export interface Contactability {
    ok: boolean;
    reasons: string[];
}

/** Decides whether a lead may be messaged: consent, eligibility, stage, email and the cooldown since the last send. */
export function checkContactability(
    lead: Lead,
    lastSentAt: string | undefined,
    rules: BusinessRules,
    now = Date.now(),
): Contactability {
    const reasons: string[] = [];
    if (lead.consent === Consent.opted_out) reasons.push("Lead has opted out of communication");
    if (lead.consent === Consent.unknown) reasons.push("No communication consent on record");
    if (lead.eligibility === Eligibility.ineligible) {
        reasons.push(`Ineligible${lead.ineligibleReason ? `: ${lead.ineligibleReason}` : ""}`);
    }
    if (TERMINAL_STAGES.includes(lead.stage)) reasons.push(`Lead is already ${lead.stage}`);
    if (!lead.email) reasons.push("No email address on record");

    if (lastSentAt && daysSince(lastSentAt, now) < rules.contactCooldownDays) {
        reasons.push(`Contacted ${daysSince(lastSentAt, now)}d ago (cooldown ${rules.contactCooldownDays}d)`);
    }
    return { ok: reasons.length === 0, reasons };
}

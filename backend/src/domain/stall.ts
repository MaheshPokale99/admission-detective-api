import { daysSince } from "../common/utils/time.js";
import { TERMINAL_STAGES, type Lead, type LeadStage } from "../modules/leads/leads.types.js";
import type { BusinessRules } from "./business-rules.js";

const STAGE_WEIGHT: Record<LeadStage, number> = {
    enquiry: 20,
    counselled: 40,
    shortlisted: 60,
    applied: 80,
    admitted: 0,
    lost: 0,
};

const STAGE_WEIGHT_SHARE = 0.6;
const RECENCY_SHARE = 0.4;
const PEAK_RECOVERY_UNTIL_DAYS = 14;
const RECENCY_DECAY_PER_DAY = 3;
const RECENCY_FLOOR = 20;

export function isStalled(lead: Lead, rules: BusinessRules, now = Date.now()): boolean {
    return !TERMINAL_STAGES.includes(lead.stage) && daysSince(lead.lastActivityAt, now) >= rules.stallThresholdDays;
}

/** 0-100 priority: later stages weigh more, and leads are most recoverable shortly after going quiet. */
export function recoveryScore(lead: Lead, rules: BusinessRules, now = Date.now()): number {
    const days = daysSince(lead.lastActivityAt, now);
    const recency =
        days < rules.stallThresholdDays
            ? 0
            : days <= PEAK_RECOVERY_UNTIL_DAYS
              ? 100
              : Math.max(RECENCY_FLOOR, 100 - (days - PEAK_RECOVERY_UNTIL_DAYS) * RECENCY_DECAY_PER_DAY);
    return Math.round(STAGE_WEIGHT[lead.stage] * STAGE_WEIGHT_SHARE + recency * RECENCY_SHARE);
}

import { MS_PER_DAY, TIMELINE_DAYS } from "../../common/constants.js";
import { InterventionStatus, type InterventionWithOutcomes } from "../interventions/interventions.types.js";
import { OutcomeType, RECOVERED_OUTCOMES } from "../outcomes/outcomes.types.js";

export interface Bucket {
    key: string;
    sent: number;
    recovered: number;
    admitted: number;
    recoveryRate: number;
}

export interface Totals {
    sent: number;
    rejected: number;
    pending: number;
    edited: number;
    recovered: number;
    admitted: number;
}

export interface TimelinePoint {
    date: string;
    sent: number;
    recovered: number;
}

export const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

const isRecovered = (i: InterventionWithOutcomes) => i.outcomes.some((o) => RECOVERED_OUTCOMES.includes(o.type));
const isAdmitted = (i: InterventionWithOutcomes) => i.outcomes.some((o) => o.type === OutcomeType.admitted);

/** Sent, recovered and admitted counts grouped by action or by primary reason, most-used first. */
export function buckets(
    rows: InterventionWithOutcomes[],
    by: "action" | "reason",
    category: string | null = null,
): Bucket[] {
    const map = new Map<string, Bucket>();
    for (const i of rows) {
        if (i.status !== InterventionStatus.sent || (category && i.primaryCategory !== category)) continue;
        const key = by === "action" ? i.action : (i.primaryCategory ?? "other");
        const bucket = map.get(key) ?? { key, sent: 0, recovered: 0, admitted: 0, recoveryRate: 0 };
        bucket.sent += 1;
        if (isRecovered(i)) bucket.recovered += 1;
        if (isAdmitted(i)) bucket.admitted += 1;
        map.set(key, bucket);
    }
    return [...map.values()]
        .map((b) => ({ ...b, recoveryRate: percent(b.recovered, b.sent) }))
        .sort((a, b) => b.sent - a.sent || a.key.localeCompare(b.key));
}

export function totals(rows: InterventionWithOutcomes[]): Totals {
    const sent = rows.filter((i) => i.status === InterventionStatus.sent);
    return {
        sent: sent.length,
        rejected: rows.filter((i) => i.status === InterventionStatus.rejected).length,
        pending: rows.filter((i) => i.status === InterventionStatus.pending_approval).length,
        edited: sent.filter((i) => i.edited).length,
        recovered: sent.filter(isRecovered).length,
        admitted: sent.filter(isAdmitted).length,
    };
}

const dayKey = (d: Date) => d.toLocaleDateString("en-CA");

/** Per-day count of messages sent and of interventions that brought a lead back. */
export function timeline(rows: InterventionWithOutcomes[], days = TIMELINE_DAYS, now = new Date()): TimelinePoint[] {
    return Array.from({ length: days }, (_, k) => {
        const date = dayKey(new Date(now.getTime() - (days - 1 - k) * MS_PER_DAY));
        const sent = rows.filter(
            (i) => i.status === InterventionStatus.sent && i.sentAt && dayKey(new Date(i.sentAt)) === date,
        ).length;
        const recovered = rows.filter((i) =>
            i.outcomes.some((o) => RECOVERED_OUTCOMES.includes(o.type) && dayKey(new Date(o.createdAt)) === date),
        ).length;
        return { date, sent, recovered };
    });
}

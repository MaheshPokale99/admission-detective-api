import { History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditEntry } from "@/lib/api";
import { OUTCOME_LABEL } from "@/lib/labels";
import { dateTime, timeAgo } from "@/lib/time";

const ACTION_TEXT: Record<string, string> = {
    investigated: "Lead investigated",
    draft_created: "Follow-up drafted",
    approved: "Message approved",
    approved_with_edits: "Message approved with edits",
    sent: "Message sent",
    send_failed: "Message could not be sent",
    rejected: "Draft rejected",
    blocked: "Sending blocked",
};

const SHOW_DETAIL = new Set(["rejected", "blocked"]);

function describe(entry: AuditEntry): { text: string; detail: string } {
    if (entry.action.startsWith("outcome:")) {
        const type = entry.action.slice("outcome:".length);
        return { text: OUTCOME_LABEL[type as keyof typeof OUTCOME_LABEL] ?? "Outcome recorded", detail: entry.detail };
    }
    return {
        text: ACTION_TEXT[entry.action] ?? "Activity recorded",
        detail: SHOW_DETAIL.has(entry.action) ? entry.detail : "",
    };
}

const actorOf = (actor: string) => (actor === "System" || actor === "Detective Agent" ? "" : actor);

export function AuditTrail({ entries }: { entries: AuditEntry[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="size-4 text-muted-foreground" aria-hidden />
                    Activity
                </CardTitle>
                <CardDescription>Everything that has happened on this lead.</CardDescription>
            </CardHeader>
            <CardContent>
                {entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nothing has happened on this lead yet.</p>
                ) : (
                    <ol className="relative space-y-4 border-l pl-5">
                        {entries.map((entry) => {
                            const { text, detail } = describe(entry);
                            const actor = actorOf(entry.actor);
                            return (
                                <li key={entry.id} className="relative text-sm">
                                    <span
                                        aria-hidden
                                        className="absolute top-1.5 -left-[25px] size-2 rounded-full bg-border ring-4 ring-card"
                                    />
                                    <p>
                                        <span className="font-medium">{text}</span>
                                        {actor && <span className="text-muted-foreground"> · {actor}</span>}
                                    </p>
                                    {detail && <p className="text-muted-foreground">{detail}</p>}
                                    <time
                                        dateTime={entry.createdAt}
                                        title={dateTime(entry.createdAt)}
                                        className="text-xs text-muted-foreground"
                                    >
                                        {timeAgo(entry.createdAt)}
                                    </time>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </CardContent>
        </Card>
    );
}

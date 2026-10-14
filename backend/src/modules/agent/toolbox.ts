import { daysSince } from "../../common/utils/time.js";
import type { InterventionsRepository } from "../interventions/interventions.repository.js";
import { buckets } from "../metrics/analytics.js";
import type { ResourcesRepository } from "../resources/resources.repository.js";
import type { ToolContext, ToolOutcome } from "./agent.types.js";
import { TOOL } from "./tool-declarations.js";

const MIN_SEARCH_TERM_LENGTH = 3;

/** The read-only tools the agent may call. Every tool is bound to one lead; the model never supplies a lead id. */
export class AgentToolbox {
    constructor(
        private readonly resources: ResourcesRepository,
        private readonly interventions: InterventionsRepository,
    ) {}

    async execute(name: string, args: Record<string, unknown>, ctx: ToolContext): Promise<ToolOutcome> {
        switch (name) {
            case TOOL.leadProfile:
                return this.leadProfile(ctx);
            case TOOL.conversation:
                return this.conversation(ctx);
            case TOOL.resources:
                return this.searchResources(typeof args.query === "string" ? args.query : "all");
            case TOOL.pastResults:
                return this.pastResults(typeof args.category === "string" && args.category ? args.category : null);
            default:
                return { output: { error: `Unknown tool ${name}` }, summary: `Unknown tool ${name}` };
        }
    }

    private leadProfile({ lead }: ToolContext): ToolOutcome {
        const days = daysSince(lead.lastActivityAt);
        return {
            output: {
                name: lead.name,
                program: lead.program,
                city: lead.city,
                stage: lead.stage,
                source: lead.source,
                counsellor: lead.counsellor,
                daysSinceLastActivity: days,
                enquiryDaysAgo: daysSince(lead.createdAt),
                consent: lead.consent,
                eligibility: lead.eligibility,
            },
            summary: `${lead.name} · stage "${lead.stage}" · ${days} days inactive`,
        };
    }

    private conversation(ctx: ToolContext): ToolOutcome {
        ctx.state.readConversation = true;
        const count = ctx.transcript.length;
        return {
            output: {
                messages: ctx.transcript.map((m) => ({
                    id: m.id,
                    channel: m.channel,
                    direction: m.direction,
                    author: m.author,
                    daysAgo: daysSince(m.sentAt),
                    text: m.body,
                })),
            },
            summary: `${count} message${count === 1 ? "" : "s"} read`,
        };
    }

    private async searchResources(rawQuery: string): Promise<ToolOutcome> {
        const query = rawQuery.toLowerCase().trim();
        const everything = await this.resources.findAll();
        const terms = query.split(/[^a-z]+/).filter((t) => t.length >= MIN_SEARCH_TERM_LENGTH && t !== "all");
        const hits =
            query === "all" || terms.length === 0
                ? everything
                : everything.filter((r) =>
                      terms.some((t) => `${r.category} ${r.title} ${r.content}`.toLowerCase().includes(t)),
                  );
        const found = hits.length > 0 ? hits : everything;
        return {
            output: { resources: found.map(({ id, category, title, content }) => ({ id, category, title, content })) },
            summary: `${found.length} verified resource${found.length === 1 ? "" : "s"}: ${found.map((r) => r.title).join(", ")}`,
        };
    }

    private async pastResults(category: string | null): Promise<ToolOutcome> {
        const byAction = buckets(await this.interventions.list(), "action", category);
        return {
            output: { category: category ?? "all", totalSent: byAction.reduce((n, r) => n + r.sent, 0), byAction },
            summary: byAction.length
                ? byAction.map((r) => `${r.key}: ${r.recovered}/${r.sent}`).join(" · ")
                : "No past results yet",
        };
    }
}

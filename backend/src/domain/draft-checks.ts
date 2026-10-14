import type { Message } from "../modules/messages/messages.types.js";
import type { Resource } from "../modules/resources/resources.types.js";

const FIGURE_PATTERN =
    /(?:₹|rs\.?\s?|inr\s?)\s?(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s?(?:%|percent|lakhs?|months?|emis?)/gi;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const appearsAsNumber = (corpus: string, numeric: string) =>
    new RegExp(`(?<![\\d,.])${escapeRegExp(numeric)}(?!\\d)`).test(corpus);

/** Returns figures in the draft whose number appears in neither the cited resources nor the lead's own messages. */
export function unverifiedFigures(draftBody: string, resources: Resource[], transcript: Message[]): string[] {
    const corpus = [...resources.map((r) => `${r.title} ${r.content}`), ...transcript.map((m) => m.body)].join(" ");
    const flagged = new Set<string>();
    for (const match of draftBody.matchAll(FIGURE_PATTERN)) {
        const numeric = match[1] ?? match[2];
        if (numeric && !appearsAsNumber(corpus, numeric)) flagged.add(match[0].trim());
    }
    return [...flagged];
}

export const strayUrls = (draftBody: string): string[] => draftBody.match(/https?:\/\/\S+/gi) ?? [];

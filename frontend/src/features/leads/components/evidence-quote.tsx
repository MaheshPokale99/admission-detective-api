import { CircleCheck, TriangleAlert } from "lucide-react";
import type { Evidence } from "@/lib/api";
import { cn } from "@/lib/utils";

interface EvidenceQuoteProps {
    evidence: Evidence;
    onSelect: (messageId: string) => void;
}

/** A quote from the conversation; selecting it highlights the source message. */
export function EvidenceQuote({ evidence, onSelect }: EvidenceQuoteProps) {
    const { quote, messageId, verified } = evidence;
    const StatusIcon = verified ? CircleCheck : TriangleAlert;
    return (
        <button
            type="button"
            onClick={() => onSelect(messageId)}
            aria-label="Show this message in the conversation"
            className={cn(
                "group flex w-full flex-col gap-1.5 rounded-lg border bg-background px-3 py-2 text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                !verified && "border-dashed",
            )}
        >
            <span className="italic">&ldquo;{quote}&rdquo;</span>
            <span className={cn("flex items-center gap-1.5 text-xs", verified ? "text-success" : "text-warning")}>
                <StatusIcon className="size-3.5 shrink-0" aria-hidden />
                {verified ? "Verified in transcript" : "Not found in transcript"}
                <span className="ml-auto hidden text-muted-foreground group-hover:inline group-focus-visible:inline">
                    Show message
                </span>
            </span>
        </button>
    );
}

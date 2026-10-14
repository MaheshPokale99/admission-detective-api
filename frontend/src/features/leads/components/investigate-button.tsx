import { Loader2, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface InvestigateButtonProps {
    isRunning: boolean;
    isReinvestigation: boolean;
    disabledReason: string | null;
    onRun: () => void;
}

export function InvestigateButton({ isRunning, isReinvestigation, disabledReason, onRun }: InvestigateButtonProps) {
    const button = (
        <Button size="lg" onClick={onRun} disabled={isRunning || !!disabledReason} className="w-full sm:w-auto">
            {isRunning ? <Loader2 className="animate-spin" /> : <ScanSearch />}
            {isRunning ? "Investigating…" : isReinvestigation ? "Re-investigate" : "Investigate this lead"}
        </Button>
    );

    if (!disabledReason || isRunning) return button;

    return (
        <Tooltip>
            <TooltipTrigger render={<span tabIndex={0} className="inline-flex w-full rounded-lg sm:w-auto" />}>
                {button}
            </TooltipTrigger>
            <TooltipContent>{disabledReason}</TooltipContent>
        </Tooltip>
    );
}

import { FileText, Lightbulb, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { InvestigationResult } from "@/lib/api";
import { ACTION_LABEL } from "@/lib/labels";

interface RecommendationCardProps {
    recommendation: InvestigationResult["recommendation"];
    onReviewDraft?: () => void;
}

export function RecommendationCard({ recommendation, onReviewDraft }: RecommendationCardProps) {
    const { action, rationale, resourceIds } = recommendation;
    const noAction = action === "no_action";

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {noAction ? (
                        <SearchX className="size-4 text-muted-foreground" aria-hidden />
                    ) : (
                        <Lightbulb className="size-4 text-primary" aria-hidden />
                    )}
                    Recommended recovery
                </CardTitle>
                <CardDescription>
                    {noAction ? "Contacting this lead is not recommended." : "Suggested next step, for you to approve."}
                </CardDescription>
                <CardAction>
                    <Badge variant={noAction ? "secondary" : "default"}>{ACTION_LABEL[action]}</Badge>
                </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed">{rationale}</p>
                {resourceIds.length > 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="size-3.5" aria-hidden />
                        {resourceIds.length} verified {resourceIds.length === 1 ? "link" : "links"} will be added to the
                        email
                    </p>
                )}
            </CardContent>
            {onReviewDraft && (
                <CardFooter className="justify-end">
                    <Button size="sm" onClick={onReviewDraft}>
                        Review draft
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationSkeleton } from "./conversation";
import { LeadHeaderSkeleton } from "./lead-header";

export function LeadDetailSkeleton() {
    return (
        <div className="space-y-6">
            <LeadHeaderSkeleton />
            <div className="grid items-start gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <ConversationSkeleton />
                </div>
                <div className="space-y-4 lg:col-span-3" aria-busy aria-label="Loading findings">
                    <Skeleton className="h-8 w-full" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-64 max-w-full" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

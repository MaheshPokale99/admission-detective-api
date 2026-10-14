import type { Metadata } from "next";
import { Suspense } from "react";
import { LeadDetailPage } from "@/features/leads/lead-detail-page";
import { LeadDetailSkeleton } from "@/features/leads/components/lead-detail-skeleton";

export const metadata: Metadata = { title: "Lead case file" };

async function LeadDetailRoute({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <LeadDetailPage id={id} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<LeadDetailSkeleton />}>
            <LeadDetailRoute params={params} />
        </Suspense>
    );
}

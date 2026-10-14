import type { Metadata } from "next";
import { LeadsPage } from "@/features/leads/leads-page";

export const metadata: Metadata = { title: "Lead Radar" };

export default function Page() {
    return <LeadsPage />;
}

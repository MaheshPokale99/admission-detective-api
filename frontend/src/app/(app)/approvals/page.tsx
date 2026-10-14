import type { Metadata } from "next";
import { ApprovalsPage } from "@/features/approvals/approvals-page";

export const metadata: Metadata = { title: "Approval queue" };

export default function Page() {
    return <ApprovalsPage />;
}

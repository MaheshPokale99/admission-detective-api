import type { Metadata } from "next";
import { RecoveryLogPage } from "@/features/recovery-log/recovery-log-page";

export const metadata: Metadata = { title: "Recovery log" };

export default function Page() {
    return <RecoveryLogPage />;
}

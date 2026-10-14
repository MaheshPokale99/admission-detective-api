import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/landing-page";

export const metadata: Metadata = {
    title: { absolute: "Admission Drop-Off Detective" },
    description:
        "Find stalled admission leads, see why they went quiet and follow up with counsellor-approved, evidence-backed messages.",
};

export default function Page() {
    return <LandingPage />;
}

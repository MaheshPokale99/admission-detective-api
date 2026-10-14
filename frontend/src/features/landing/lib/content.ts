import {
    BadgeCheck,
    FileSearch,
    History,
    Radar,
    Send,
    ShieldCheck,
    TrendingUp,
    UserCheck,
    UserRoundCheck,
    Link2,
    Timer,
    Gavel,
    type LucideIcon,
} from "lucide-react";

export interface Step {
    title: string;
    description: string;
    icon: LucideIcon;
}

export const STEPS: readonly Step[] = [
    { title: "Detect", description: "Leads silent for 5+ days are flagged and ranked.", icon: Radar },
    {
        title: "Check consent",
        description: "Opted-out, ineligible and recently contacted leads are skipped.",
        icon: ShieldCheck,
    },
    { title: "Investigate", description: "An AI agent reads the conversation with read-only tools.", icon: FileSearch },
    {
        title: "Verify",
        description: "Every quote and figure is checked against the real transcript.",
        icon: BadgeCheck,
    },
    { title: "Approve", description: "A counsellor edits, approves or rejects the draft.", icon: UserCheck },
    { title: "Send", description: "Exactly the approved text goes out.", icon: Send },
    { title: "Learn", description: "Outcomes feed back so you see what works.", icon: TrendingUp },
];

export const SAFEGUARDS: readonly Step[] = [
    {
        title: "Consent respected",
        description: "Opted-out leads are never contacted, whatever the agent suggests.",
        icon: ShieldCheck,
    },
    {
        title: "Eligibility checked",
        description: "Ineligible and closed leads are filtered out before any drafting.",
        icon: UserRoundCheck,
    },
    {
        title: "Cooldown between messages",
        description: "Recently contacted leads are left alone so nobody gets nagged.",
        icon: Timer,
    },
    {
        title: "Human approval required",
        description: "Nothing is sent until a counsellor signs off on the exact text.",
        icon: Gavel,
    },
    {
        title: "Only verified facts and links",
        description: "Quotes, figures and links are checked before they reach a draft.",
        icon: Link2,
    },
    {
        title: "Full activity log",
        description: "Every investigation, approval and outcome is recorded.",
        icon: History,
    },
];

import {
    BadgeCheck,
    CalendarCheck,
    CircleDashed,
    CircleDot,
    Clock,
    FileCheck,
    GraduationCap,
    Lock,
    Mail,
    MailCheck,
    MessageSquareReply,
    MinusCircle,
    ShieldAlert,
    Sparkles,
    TriangleAlert,
    type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Intervention, LeadStatus, OutcomeType, Stage } from "@/lib/api/types";
import { OUTCOME_LABEL, STAGE_LABEL, STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
    success: "[&>svg]:text-success",
    warning: "[&>svg]:text-warning",
    info: "[&>svg]:text-info",
    danger: "[&>svg]:text-destructive",
    accent: "[&>svg]:text-foreground",
    muted: "text-muted-foreground",
} as const;

export type Tone = keyof typeof TONE_CLASSES;

export function ToneBadge({ tone, className, ...props }: React.ComponentProps<typeof Badge> & { tone: Tone }) {
    return <Badge variant="outline" className={cn("gap-1.5 font-medium", TONE_CLASSES[tone], className)} {...props} />;
}

const STATUS: Record<LeadStatus, { tone: Tone; icon: LucideIcon }> = {
    protected: { tone: "danger", icon: ShieldAlert },
    ready: { tone: "accent", icon: Sparkles },
    awaiting_approval: { tone: "warning", icon: Clock },
    contacted: { tone: "info", icon: Mail },
    recovered: { tone: "success", icon: BadgeCheck },
    active: { tone: "muted", icon: CircleDot },
    closed: { tone: "muted", icon: Lock },
};

export function StatusBadge({ status }: { status: LeadStatus }) {
    const { tone, icon: Icon } = STATUS[status];
    return (
        <ToneBadge tone={tone}>
            <Icon aria-hidden />
            {STATUS_LABEL[status]}
        </ToneBadge>
    );
}

export function StageBadge({ stage }: { stage: Stage }) {
    return <Badge variant="secondary">{STAGE_LABEL[stage]}</Badge>;
}

const INTERVENTION: Record<Intervention["status"], { tone: Tone; label: string; icon: LucideIcon }> = {
    pending_approval: { tone: "warning", label: "Pending approval", icon: Clock },
    approved: { tone: "info", label: "Sending", icon: Mail },
    sent: { tone: "success", label: "Sent", icon: MailCheck },
    rejected: { tone: "muted", label: "Rejected", icon: CircleDashed },
    failed: { tone: "danger", label: "Failed", icon: TriangleAlert },
};

export function InterventionBadge({ status }: { status: Intervention["status"] }) {
    const { tone, label, icon: Icon } = INTERVENTION[status];
    return (
        <ToneBadge tone={tone}>
            <Icon aria-hidden />
            {label}
        </ToneBadge>
    );
}

const OUTCOME: Record<OutcomeType, { tone: Tone; icon: LucideIcon }> = {
    replied: { tone: "info", icon: MessageSquareReply },
    session_booked: { tone: "accent", icon: CalendarCheck },
    application_resumed: { tone: "success", icon: FileCheck },
    admitted: { tone: "success", icon: GraduationCap },
    no_response: { tone: "muted", icon: MinusCircle },
};

export function OutcomeBadge({ type }: { type: OutcomeType }) {
    const { tone, icon: Icon } = OUTCOME[type];
    return (
        <ToneBadge tone={tone}>
            <Icon aria-hidden />
            {OUTCOME_LABEL[type]}
        </ToneBadge>
    );
}

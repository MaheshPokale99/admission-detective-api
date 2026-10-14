import type { LeadStatus, OutcomeType, ReasonCategory, RecoveryAction, Stage } from "@/lib/api/types";

export const STAGE_LABEL: Record<Stage, string> = {
    enquiry: "Enquiry",
    counselled: "Counselled",
    shortlisted: "Shortlisted",
    applied: "Applied",
    admitted: "Admitted",
    lost: "Lost",
};

export const REASON_LABEL: Record<ReasonCategory, string> = {
    fees: "Fees",
    parent_approval: "Parent approval",
    course_clarity: "Course clarity",
    missing_information: "Missing information",
    competitor: "Chose a competitor",
    callback_missed: "Callback missed",
    timing: "Timing",
    other: "Other",
};

export const ACTION_LABEL: Record<RecoveryAction, string> = {
    send_fee_resource: "Send fee details",
    offer_parent_session: "Offer parent session",
    share_scholarship_info: "Share scholarship info",
    share_curriculum_info: "Share curriculum",
    answer_pending_question: "Answer pending question",
    schedule_callback: "Schedule callback",
    no_action: "No action",
};

export const OUTCOME_LABEL: Record<OutcomeType, string> = {
    replied: "Lead replied",
    session_booked: "Session booked",
    application_resumed: "Application resumed",
    admitted: "Took admission",
    no_response: "No response",
};

export const STATUS_LABEL: Record<LeadStatus, string> = {
    protected: "Protected",
    ready: "Ready to investigate",
    awaiting_approval: "Awaiting approval",
    contacted: "Contacted",
    recovered: "Recovered",
    active: "Active",
    closed: "Closed",
};

export const labelFor = (map: Record<string, string>, key: string) => map[key] ?? key.replace(/_/g, " ");

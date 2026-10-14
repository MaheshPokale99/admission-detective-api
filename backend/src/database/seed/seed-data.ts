import type {
    Consent,
    Eligibility,
    LeadStage,
    MessageChannel,
    MessageDirection,
    OutcomeType,
    ReasonCategory,
    RecoveryAction,
} from "../../generated/prisma/enums.js";
import type { Resource } from "../../modules/resources/resources.types.js";

const DAY = 86_400_000;
/** ISO timestamp `d` days ago at the given UTC hour. */
export const ago = (d: number, hour = 11, now = Date.now()) => {
    const t = new Date(now - d * DAY);
    t.setUTCHours(hour, 15, 0, 0);
    return t.toISOString();
};

/** Demo knowledge base: replace with the admissions team's real, verified facts. */
export const RESOURCES = (now = Date.now()): Resource[] => {
    const v = ago(10, 9, now);
    const by = "Admissions Ops (demo)";
    return [
        {
            id: "res_fees",
            category: "fees",
            title: "Fee structure 2026-27",
            content:
                "Annual tuition is ₹2,40,000 for the 4-year B.Tech program. A one-time registration fee of ₹10,000 is adjusted against the first-year tuition. Hostel and food are optional and billed separately.",
            url: "https://admissions.niat.example/fees",
            verifiedAt: v,
            verifiedBy: by,
        },
        {
            id: "res_emi",
            category: "fees",
            title: "EMI and financing options",
            content:
                "Tuition can be paid through 12, 24 or 36 month EMI plans with partner banks. Eligible families can choose a no-cost EMI plan on the 12 month option. Pre-approval takes about 2 working days.",
            url: "https://admissions.niat.example/emi",
            verifiedAt: v,
            verifiedBy: by,
        },
        {
            id: "res_scholarship",
            category: "scholarship",
            title: "Merit scholarship",
            content:
                "Students scoring in the top band of the NIAT entrance assessment can receive a merit scholarship of up to 50% on tuition. Scholarships are awarded after the assessment and are renewed yearly based on academic performance.",
            url: "https://admissions.niat.example/scholarship",
            verifiedAt: v,
            verifiedBy: by,
        },
        {
            id: "res_parent_session",
            category: "parent_session",
            title: "Parent counselling session",
            content:
                "A free 30 minute online session where parents can ask a senior counsellor about fees, safety, hostel, curriculum and career outcomes. Sessions run every Saturday and Sunday and can be booked in advance.",
            url: "https://admissions.niat.example/parent-session",
            verifiedAt: v,
            verifiedBy: by,
        },
        {
            id: "res_curriculum",
            category: "curriculum",
            title: "Curriculum overview",
            content:
                "The 4-year curriculum combines core computer science with AI and data science electives, project-based learning every semester and an industry internship in the final year.",
            url: "https://admissions.niat.example/curriculum",
            verifiedAt: v,
            verifiedBy: by,
        },
        {
            id: "res_documents",
            category: "documents",
            title: "Application document checklist",
            content:
                "To complete an application you need: Class 10 and 12 marksheets, a government photo ID, a passport size photograph and a parent or guardian declaration. Documents can be uploaded in the application portal and saved as a draft.",
            url: "https://admissions.niat.example/documents",
            verifiedAt: v,
            verifiedBy: by,
        },
        {
            id: "res_hostel",
            category: "campus",
            title: "Campus and hostel information",
            content:
                "Hostel accommodation is available on or near campus with 24x7 security, warden supervision and vegetarian and non-vegetarian food options. A virtual campus tour is available on request.",
            url: "https://admissions.niat.example/campus",
            verifiedAt: v,
            verifiedBy: by,
        },
        {
            id: "res_callback",
            category: "callback",
            title: "Book a counsellor call",
            content:
                "Students can pick a convenient 20 minute slot with their counsellor, between 9am and 8pm on any day.",
            url: "https://admissions.niat.example/book-call",
            verifiedAt: v,
            verifiedBy: by,
        },
    ];
};

type Msg = [
    channel: MessageChannel,
    direction: MessageDirection,
    author: string,
    body: string,
    daysAgo: number,
    hour?: number,
];

export interface LeadSeed {
    key: string;
    name: string;
    email?: string;
    city: string;
    program: string;
    stage: LeadStage;
    consent?: Consent;
    consentNote?: string;
    eligibility?: Eligibility;
    ineligibleReason?: string;
    counsellor: string;
    source: string;
    createdDaysAgo: number;
    lastActivityDaysAgo: number;
    messages: Msg[];
}

const CS = "B.Tech Computer Science (AI & Data Science)";

export const LEADS: LeadSeed[] = [
    {
        key: "rahul",
        name: "Rahul Verma",
        city: "Hyderabad",
        program: CS,
        stage: "counselled",
        counsellor: "Neha Kapoor",
        source: "Website enquiry form",
        createdDaysAgo: 14,
        lastActivityDaysAgo: 8,
        messages: [
            [
                "form",
                "inbound",
                "Rahul Verma",
                "Hi, I am interested in the B.Tech CS (AI & Data Science) program. Please share the fee details and any scholarship options.",
                14,
                8,
            ],
            [
                "call_note",
                "internal",
                "Neha Kapoor",
                'Called Rahul. He liked the AI curriculum and the project-based approach. He said: "The course sounds good, but I need to discuss the fees with my parents." Father is the decision maker. Promised to send fee details.',
                10,
                12,
            ],
            [
                "whatsapp",
                "inbound",
                "Rahul Verma",
                "Can you send the fee breakup and EMI options? Papa wants to see it before deciding.",
                8,
                17,
            ],
        ],
    },
    {
        key: "ananya",
        name: "Ananya Iyer",
        city: "Chennai",
        program: CS,
        stage: "shortlisted",
        counsellor: "Neha Kapoor",
        source: "Instagram campaign",
        createdDaysAgo: 22,
        lastActivityDaysAgo: 11,
        messages: [
            [
                "form",
                "inbound",
                "Ananya Iyer",
                "I want to know how this is different from a regular engineering college.",
                22,
                9,
            ],
            [
                "call_note",
                "internal",
                "Neha Kapoor",
                "Strong profile. Ananya is comparing with two other colleges. Asked what she will actually build in the first year. Counsellor explained the model in general terms only.",
                18,
                15,
            ],
            [
                "whatsapp",
                "inbound",
                "Ananya Iyer",
                "Thanks for the call. Could you share a detailed syllabus for year 1 and 2? I want to compare with the other colleges I am looking at.",
                11,
                19,
            ],
        ],
    },
    {
        key: "karthik",
        name: "Karthik Reddy",
        city: "Vijayawada",
        program: CS,
        stage: "applied",
        counsellor: "Arjun Rao",
        source: "Referral",
        createdDaysAgo: 20,
        lastActivityDaysAgo: 6,
        messages: [
            ["form", "inbound", "Karthik Reddy", "Referred by my senior. I would like to apply.", 20, 10],
            [
                "call_note",
                "internal",
                "Arjun Rao",
                "Karthik started the online application. Wants the merit scholarship. Application saved as draft.",
                12,
                14,
            ],
            [
                "whatsapp",
                "inbound",
                "Karthik Reddy",
                "Which documents do I need to upload? The portal says documents pending but I am not sure what is missing.",
                6,
                20,
            ],
        ],
    },
    {
        key: "sneha",
        name: "Sneha Patel",
        city: "Ahmedabad",
        program: CS,
        stage: "counselled",
        counsellor: "Arjun Rao",
        source: "Google Ads",
        createdDaysAgo: 25,
        lastActivityDaysAgo: 15,
        messages: [
            ["form", "inbound", "Sneha Patel", "Please call me regarding admissions.", 25, 13],
            [
                "call_note",
                "internal",
                "Arjun Rao",
                "Short call. Sneha was in class and asked to be called back after 6pm. Callback not yet done.",
                21,
                12,
            ],
            ["whatsapp", "inbound", "Sneha Patel", "Hello? I was waiting for your call yesterday evening.", 15, 9],
        ],
    },
    {
        key: "faizan",
        name: "Mohammed Faizan",
        city: "Lucknow",
        program: CS,
        stage: "shortlisted",
        counsellor: "Neha Kapoor",
        source: "College fair",
        createdDaysAgo: 19,
        lastActivityDaysAgo: 9,
        messages: [
            [
                "form",
                "inbound",
                "Mohammed Faizan",
                "Met your team at the college fair. Interested in the AI program.",
                19,
                11,
            ],
            [
                "call_note",
                "internal",
                "Neha Kapoor",
                "Faizan is keen. His mother is worried about him staying away from home and wants to know about hostel safety. Parents have not spoken to anyone from the team yet.",
                9,
                16,
            ],
        ],
    },
    {
        key: "divya",
        name: "Divya Sharma",
        city: "Jaipur",
        program: CS,
        stage: "enquiry",
        counsellor: "Arjun Rao",
        source: "Website enquiry form",
        createdDaysAgo: 6,
        lastActivityDaysAgo: 6,
        messages: [
            [
                "form",
                "inbound",
                "Divya Sharma",
                "I scored 91% in Class 12. Is there any scholarship for toppers? Also how do I book a counselling call?",
                6,
                18,
            ],
        ],
    },
    {
        key: "ishita",
        name: "Ishita Gupta",
        city: "Delhi",
        program: CS,
        stage: "shortlisted",
        counsellor: "Neha Kapoor",
        source: "Website enquiry form",
        createdDaysAgo: 9,
        lastActivityDaysAgo: 2,
        messages: [
            ["form", "inbound", "Ishita Gupta", "Interested in the program, please call.", 9, 10],
            [
                "call_note",
                "internal",
                "Neha Kapoor",
                "Good call. Ishita will complete the entrance assessment this week.",
                5,
                13,
            ],
            ["whatsapp", "inbound", "Ishita Gupta", "Booked my assessment slot for Friday!", 2, 16],
        ],
    },
    {
        key: "priya",
        name: "Priya Nair",
        city: "Kochi",
        program: CS,
        stage: "counselled",
        consent: "opted_out",
        consentNote: "Replied STOP on WhatsApp",
        counsellor: "Neha Kapoor",
        source: "Website enquiry form",
        createdDaysAgo: 20,
        lastActivityDaysAgo: 10,
        messages: [
            ["form", "inbound", "Priya Nair", "Tell me about fees.", 20, 11],
            [
                "call_note",
                "internal",
                "Neha Kapoor",
                "Shared fee details. Priya said she is not interested right now.",
                14,
                12,
            ],
            ["whatsapp", "inbound", "Priya Nair", "STOP. Please do not contact me again.", 10, 9],
        ],
    },
    {
        key: "arjunm",
        name: "Arjun Mehta",
        city: "Pune",
        program: CS,
        stage: "enquiry",
        eligibility: "ineligible",
        ineligibleReason: "Class 12 without Mathematics (minimum requirement)",
        counsellor: "Arjun Rao",
        source: "Google Ads",
        createdDaysAgo: 15,
        lastActivityDaysAgo: 12,
        messages: [
            ["form", "inbound", "Arjun Mehta", "I am in Class 12 commerce stream, can I join?", 15, 14],
            [
                "call_note",
                "internal",
                "Arjun Rao",
                "Does not have Mathematics in Class 12. Explained eligibility. Flagged ineligible.",
                12,
                13,
            ],
        ],
    },
    {
        key: "rohan",
        name: "Rohan Das",
        city: "Kolkata",
        program: CS,
        stage: "counselled",
        consent: "unknown",
        consentNote: "Imported from a partner list; consent not captured",
        counsellor: "Arjun Rao",
        source: "Partner list import",
        createdDaysAgo: 18,
        lastActivityDaysAgo: 13,
        messages: [
            [
                "call_note",
                "internal",
                "Arjun Rao",
                "Cold call from partner list. Rohan listened and asked for a brochure.",
                13,
                12,
            ],
        ],
    },
    {
        key: "mahesh",
        name: "Mahesh Pokale",
        email: "maheshpokale740@gmail.com",
        city: "Pune",
        program: CS,
        stage: "counselled",
        counsellor: "Neha Kapoor",
        source: "Website enquiry form",
        createdDaysAgo: 13,
        lastActivityDaysAgo: 7,
        messages: [
            [
                "form",
                "inbound",
                "Mahesh Pokale",
                "Hi, I finished Class 12 with 88%. Please tell me about the scholarship and how placements work.",
                13,
                10,
            ],
            [
                "call_note",
                "internal",
                "Neha Kapoor",
                'Mahesh is keen on the AI track. His parents are in Pune and are worried about hostel safety. He said: "I will confirm after my father checks the hostel details." Promised to send campus and hostel information.',
                9,
                16,
            ],
            [
                "whatsapp",
                "inbound",
                "Mahesh Pokale",
                "Can you share the hostel details and food options? My father wants to check them before the fee payment.",
                7,
                19,
            ],
        ],
    },
];

interface HistoricalSeed {
    key: string;
    name: string;
    stage: LeadStage;
    action: RecoveryAction;
    category: ReasonCategory;
    outcomes: [OutcomeType, string][];
    status?: "sent" | "rejected";
    edited?: boolean;
    sentDaysAgo: number;
    subject: string;
    body: string;
}

export const HISTORY: HistoricalSeed[] = [
    {
        key: "h_vikram",
        name: "Vikram Singh",
        stage: "admitted",
        action: "offer_parent_session",
        category: "parent_approval",
        outcomes: [
            ["session_booked", "Parents joined Saturday session"],
            ["admitted", "Paid registration fee"],
        ],
        sentDaysAgo: 24,
        edited: true,
        subject: "A session for your parents, Vikram",
        body: "Hi Vikram, I know the decision involves your parents. We run a free 30 minute parent session every weekend.",
    },
    {
        key: "h_meera",
        name: "Meera Joshi",
        stage: "applied",
        action: "send_fee_resource",
        category: "fees",
        outcomes: [
            ["replied", "Replied with questions about EMI"],
            ["application_resumed", "Resumed application"],
        ],
        sentDaysAgo: 20,
        subject: "Fee structure and EMI options",
        body: "Hi Meera, here is the fee structure and EMI plans you asked about.",
    },
    {
        key: "h_suresh",
        name: "Suresh Babu",
        stage: "counselled",
        action: "send_fee_resource",
        category: "fees",
        outcomes: [["replied", "Asked a follow-up question"]],
        sentDaysAgo: 18,
        subject: "Fee details you asked for",
        body: "Hi Suresh, sharing the fee structure we discussed.",
    },
    {
        key: "h_nisha",
        name: "Nisha Rao",
        stage: "lost",
        action: "send_fee_resource",
        category: "fees",
        outcomes: [["no_response", "No reply after 7 days"]],
        sentDaysAgo: 17,
        subject: "Fee details",
        body: "Hi Nisha, here are the fee details.",
    },
    {
        key: "h_tanvi",
        name: "Tanvi Kulkarni",
        stage: "shortlisted",
        action: "offer_parent_session",
        category: "parent_approval",
        outcomes: [["session_booked", "Booked Sunday session"]],
        sentDaysAgo: 15,
        subject: "Would your parents like to join a session?",
        body: "Hi Tanvi, we would love to answer your parents' questions directly.",
    },
    {
        key: "h_dev",
        name: "Dev Malhotra",
        stage: "shortlisted",
        action: "share_curriculum_info",
        category: "course_clarity",
        outcomes: [["replied", "Thanked and asked about internships"]],
        sentDaysAgo: 14,
        subject: "Curriculum overview",
        body: "Hi Dev, here is the curriculum overview you asked for.",
    },
    {
        key: "h_aisha",
        name: "Aisha Khan",
        stage: "applied",
        action: "answer_pending_question",
        category: "missing_information",
        outcomes: [
            ["application_resumed", "Uploaded documents"],
            ["admitted", "Admission confirmed"],
        ],
        sentDaysAgo: 13,
        subject: "Your document checklist",
        body: "Hi Aisha, here is the full checklist of documents you asked about.",
    },
    {
        key: "h_kunal",
        name: "Kunal Bhatt",
        stage: "counselled",
        action: "schedule_callback",
        category: "callback_missed",
        outcomes: [["replied", "Picked a call slot"]],
        sentDaysAgo: 12,
        subject: "Sorry we missed your call",
        body: "Hi Kunal, apologies for the missed callback. Pick any slot that suits you.",
    },
    {
        key: "h_rina",
        name: "Rina Paul",
        stage: "lost",
        action: "offer_parent_session",
        category: "parent_approval",
        outcomes: [["no_response", "No reply"]],
        sentDaysAgo: 11,
        subject: "A session for your parents",
        body: "Hi Rina, we run free parent sessions every weekend.",
    },
    {
        key: "h_omkar",
        name: "Omkar Patil",
        stage: "shortlisted",
        action: "share_scholarship_info",
        category: "fees",
        outcomes: [["replied", "Asked about the entrance assessment"]],
        sentDaysAgo: 9,
        subject: "Merit scholarship details",
        body: "Hi Omkar, here is how the merit scholarship works.",
    },
    {
        key: "h_zoya",
        name: "Zoya Ali",
        stage: "shortlisted",
        action: "send_fee_resource",
        category: "fees",
        outcomes: [],
        status: "rejected",
        sentDaysAgo: 8,
        subject: "Fees",
        body: "Hi Zoya, fees attached.",
    },
];

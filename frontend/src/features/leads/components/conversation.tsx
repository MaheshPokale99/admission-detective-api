"use client";

import { motion } from "framer-motion";
import { FileText, Mail, MessageCircle, MessageSquareOff, Phone, StickyNote, type LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@/lib/api";
import { dateTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export interface MessageFocus {
    id: string;
    key: number;
}

const CHANNEL: Record<Message["channel"], { icon: LucideIcon; label: string }> = {
    form: { icon: FileText, label: "Enquiry form" },
    call_note: { icon: Phone, label: "Call note" },
    whatsapp: { icon: MessageCircle, label: "WhatsApp" },
    email: { icon: Mail, label: "Email" },
};

interface ConversationProps {
    messages: Message[];
    focus: MessageFocus | null;
    onSelect: (id: string | null) => void;
}

export function Conversation({ messages, focus, onSelect }: ConversationProps) {
    const refs = useRef<Record<string, HTMLButtonElement | null>>({});

    useEffect(() => {
        if (focus) refs.current[focus.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [focus]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>Select a message to mark it. Evidence quotes jump here.</CardDescription>
                <CardAction>
                    <Badge variant="secondary" className="tabular-nums">
                        {messages.length} {messages.length === 1 ? "message" : "messages"}
                    </Badge>
                </CardAction>
            </CardHeader>
            <CardContent>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                        <MessageSquareOff className="size-5" />
                        <p className="text-sm">No interactions recorded for this lead.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-112 lg:h-[calc(100svh-18rem)] lg:min-h-96">
                        <ol className="space-y-3 pr-3">
                            {messages.map((message, index) => (
                                <li key={message.id}>
                                    <MessageBubble
                                        message={message}
                                        index={index}
                                        active={focus?.id === message.id}
                                        onSelect={onSelect}
                                        buttonRef={(el) => {
                                            refs.current[message.id] = el;
                                        }}
                                    />
                                </li>
                            ))}
                        </ol>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}

interface MessageBubbleProps {
    message: Message;
    index: number;
    active: boolean;
    onSelect: (id: string | null) => void;
    buttonRef: (el: HTMLButtonElement | null) => void;
}

function MessageBubble({ message: m, index, active, onSelect, buttonRef }: MessageBubbleProps) {
    const internal = m.direction === "internal";
    const Icon = internal ? StickyNote : CHANNEL[m.channel].icon;
    return (
        <motion.button
            ref={buttonRef}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? null : m.id)}
            initial={{ opacity: 0, x: m.direction === "outbound" ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.4) }}
            className={cn(
                "block w-full rounded-xl border p-3 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                m.direction === "inbound" && "mr-6 bg-card hover:bg-muted/50",
                m.direction === "outbound" && "ml-6 bg-muted/60 hover:bg-muted",
                internal && "border-dashed bg-card hover:bg-muted/50",
                active && "border-foreground/40 bg-muted ring-2 ring-ring",
            )}
        >
            <span className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <Icon className="size-3.5" aria-hidden />
                <span className="font-medium text-foreground">{m.author}</span>
                <span>{internal ? "Counsellor note" : CHANNEL[m.channel].label}</span>
                <time dateTime={m.sentAt} className="ml-auto tabular-nums">
                    {dateTime(m.sentAt)}
                </time>
            </span>
            <span className="block leading-relaxed whitespace-pre-wrap">{m.body}</span>
        </motion.button>
    );
}

export function ConversationSkeleton() {
    return (
        <Card aria-busy aria-label="Loading conversation">
            <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-56 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="mr-6 h-20 rounded-xl" />
                <Skeleton className="ml-6 h-24 rounded-xl" />
                <Skeleton className="mr-6 h-16 rounded-xl" />
                <Skeleton className="ml-6 h-20 rounded-xl" />
            </CardContent>
        </Card>
    );
}

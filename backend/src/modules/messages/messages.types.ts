import type { MessageChannel, MessageDirection } from "../../generated/prisma/enums.js";

export interface Message {
    id: string;
    leadId: string;
    channel: MessageChannel;
    direction: MessageDirection;
    author: string;
    body: string;
    sentAt: string;
}

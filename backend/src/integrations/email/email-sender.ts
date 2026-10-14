import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import type { EmailConfig } from "../../config/env.js";

const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
const SMTP_SOCKET_TIMEOUT_MS = 20_000;

interface SendResult {
    provider: "smtp" | "resend" | "simulated";
    messageId: string | null;
}

export interface EmailSender {
    send(to: string, subject: string, text: string): Promise<SendResult>;
    /** Checks the provider is reachable and the credentials work; absent for providers with nothing to check. */
    verify?(): Promise<void>;
}

/** Records the send without delivering anything; used when no email provider is configured. */
class SimulatedEmailSender implements EmailSender {
    send(): Promise<SendResult> {
        return Promise.resolve({ provider: "simulated", messageId: null });
    }
}

class ResendEmailSender implements EmailSender {
    private readonly client: Resend;

    constructor(
        apiKey: string,
        private readonly from: string,
    ) {
        this.client = new Resend(apiKey);
    }

    async send(to: string, subject: string, text: string): Promise<SendResult> {
        const { data, error } = await this.client.emails.send({ from: this.from, to, subject, text });
        if (error) throw new Error(`Resend error: ${error.message}`);
        return { provider: "resend", messageId: data?.id ?? null };
    }
}

/** Sends through any SMTP server (Gmail, Outlook, Brevo, a corporate relay), so no verified domain is needed. */
export class SmtpEmailSender implements EmailSender {
    private readonly transporter: Transporter;

    constructor(
        smtp: EmailConfig["smtp"],
        private readonly from: string,
    ) {
        this.transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: { user: smtp.user, pass: smtp.pass },
            connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
            greetingTimeout: SMTP_CONNECTION_TIMEOUT_MS,
            socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
        });
    }

    async send(to: string, subject: string, text: string): Promise<SendResult> {
        const info = await this.transporter.sendMail({ from: this.from, to, subject, text });
        const rejected = info.rejected ?? [];
        if (rejected.length > 0) throw new Error(`SMTP server rejected the recipient: ${rejected.join(", ")}`);
        return { provider: "smtp", messageId: info.messageId };
    }

    async verify(): Promise<void> {
        await this.transporter.verify();
    }
}

export function createEmailSender(config: EmailConfig): EmailSender {
    switch (config.provider) {
        case "smtp":
            return new SmtpEmailSender(config.smtp, config.from);
        case "resend":
            return new ResendEmailSender(config.resendApiKey, config.from);
        default:
            return new SimulatedEmailSender();
    }
}

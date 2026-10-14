import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
    constructor(
        message: string,
        readonly status: ContentfulStatusCode,
        readonly code: string,
        readonly details?: unknown,
    ) {
        super(message);
        this.name = new.target.name;
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404, "NOT_FOUND");
    }
}

export class ConflictError extends AppError {
    constructor(message: string, reasons: string[] = []) {
        super(message, 409, "CONFLICT", reasons.length > 0 ? { reasons } : undefined);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 422, "VALIDATION_ERROR", details);
    }
}

export class PayloadTooLargeError extends AppError {
    constructor() {
        super("Request body is too large", 413, "PAYLOAD_TOO_LARGE");
    }
}

export class RateLimitError extends AppError {
    constructor(readonly retryAfterSeconds: number) {
        super("Too many requests, slow down and retry shortly", 429, "RATE_LIMITED", { retryAfterSeconds });
    }
}

export class UpstreamError extends AppError {
    constructor(message: string) {
        super(message, 502, "UPSTREAM_ERROR");
    }
}

export class DeliveryError extends AppError {
    constructor() {
        super("The message was approved but could not be sent. Try again in a moment.", 502, "EMAIL_DELIVERY_FAILED");
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(message: string) {
        super(message, 503, "SERVICE_UNAVAILABLE");
    }
}

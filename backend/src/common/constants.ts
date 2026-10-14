export const API_PREFIX = "/api/v1";

export const MS_PER_DAY = 86_400_000;
export const MS_PER_MINUTE = 60_000;

export const REQUEST_ID_HEADER = "x-request-id";
export const MAX_BODY_BYTES = 100 * 1024;

export const MAX_SUBJECT_LENGTH = 200;
export const MAX_BODY_LENGTH = 5000;
export const MAX_REVIEWER_LENGTH = 80;
export const MAX_NOTE_LENGTH = 500;

export const AGENT_MAX_TURNS = 10;
export const AGENT_MAX_IDLE_TURNS = 2;
export const AGENT_MAX_RETRIES = 3;
export const AGENT_RETRY_BASE_MS = 1500;
export const AGENT_TEMPERATURE = 0.2;

export const MESSAGE_PREVIEW_LENGTH = 140;
export const TIMELINE_DAYS = 14;
export const SHUTDOWN_TIMEOUT_MS = 10_000;

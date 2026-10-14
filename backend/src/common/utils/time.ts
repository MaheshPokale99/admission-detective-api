import { MS_PER_DAY } from "../constants.js";

export const daysSince = (iso: string, now = Date.now()) =>
    Math.max(0, Math.floor((now - Date.parse(iso)) / MS_PER_DAY));

export const nowIso = () => new Date().toISOString();

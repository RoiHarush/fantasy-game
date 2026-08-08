const APP_TIME_ZONE = "Asia/Jerusalem";

function getTimeZoneOffset(timestamp, timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date(timestamp));
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));

    return Date.UTC(
        values.year,
        values.month - 1,
        values.day,
        values.hour,
        values.minute,
        values.second,
    ) - timestamp;
}

function appWallClockToTimestamp([year, month, day, hour = 0, minute = 0, second = 0]) {
    if (![year, month, day, hour, minute, second].every(Number.isFinite)) return null;

    const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    let timestamp = wallClockAsUtc;

    // A second pass handles the rare case where the first estimate crosses a DST boundary.
    for (let attempt = 0; attempt < 2; attempt += 1) {
        timestamp = wallClockAsUtc - getTimeZoneOffset(timestamp, APP_TIME_ZONE);
    }

    return Number.isNaN(timestamp) ? null : timestamp;
}

function normalizeDate(value) {
    if (!value) return null;

    if (Array.isArray(value)) {
        if (value.length < 3) return null;
        const [year, month, day, hour = 0, minute = 0, second = 0] = value;
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
        return Number.isNaN(date.getTime()) ? null : { date, timeZone: "UTC" };
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : { date, timeZone: APP_TIME_ZONE };
}

export function formatAppDateTime(value, locale = "en-GB") {
    const normalized = normalizeDate(value);
    if (!normalized) return null;

    const { date, timeZone } = normalized;
    const dateText = new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone,
    }).format(date).replaceAll(",", "");
    const timeText = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone,
    }).format(date);

    return `${dateText} ${timeText}`;
}

export function formatAppLongDate(value, locale = "en-GB") {
    const normalized = normalizeDate(value);
    if (!normalized) return "";

    return new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: normalized.timeZone,
    }).format(normalized.date);
}

export function formatAppTime(value, locale = "en-GB") {
    const normalized = normalizeDate(value);
    if (!normalized) return "";

    return new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: normalized.timeZone,
    }).format(normalized.date);
}

export function getAppDateKey(value) {
    const normalized = normalizeDate(value);
    if (!normalized) return null;

    const parts = new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: normalized.timeZone,
    }).formatToParts(normalized.date);
    const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
    return `${values.year}-${values.month}-${values.day}`;
}

export function toAppTimestamp(value) {
    if (!value) return null;

    if (Array.isArray(value)) {
        if (value.length < 3) return null;
        return appWallClockToTimestamp(value);
    }

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
        const parts = value.split(/[-T:]/).map(Number);
        return appWallClockToTimestamp(parts);
    }

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
}

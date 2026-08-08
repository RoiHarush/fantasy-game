const APP_TIME_ZONE = "Asia/Jerusalem";

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

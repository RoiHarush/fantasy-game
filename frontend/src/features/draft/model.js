export function toDateTimeLocalInput(value) {
    if (!value) return "";
    if (Array.isArray(value)) {
        const [year, month, day, hour = 0, minute = 0] = value;
        if (![year, month, day, hour, minute].every(Number.isFinite)) return "";
        return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
    return typeof value === "string" ? value.slice(0, 16) : "";
}

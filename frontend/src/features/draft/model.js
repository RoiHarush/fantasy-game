export function toDateTimeLocalInput(value) {
    if (!value) return "";
    if (Array.isArray(value)) {
        const [year, month, day, hour = 0, minute = 0] = value;
        if (![year, month, day, hour, minute].every(Number.isFinite)) return "";
        return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
    return typeof value === "string" ? value.slice(0, 16) : "";
}

export function validateDraftOrder(order, leagueUserIds, roundCount = 1) {
    const expectedLength = leagueUserIds.length * roundCount;
    if (order.length !== expectedLength) {
        return `Choose a manager for all ${expectedLength} draft positions.`;
    }

    const knownManagerIds = new Set(leagueUserIds.map(String));
    if (order.some((id) => !knownManagerIds.has(String(id)))) {
        return "The draft order contains an unknown manager.";
    }

    const invalidManagerId = leagueUserIds.find((userId) => (
        order.filter((id) => String(id) === String(userId)).length !== roundCount
    ));
    if (invalidManagerId !== undefined) {
        const frequency = roundCount === 1 ? "once" : `${roundCount} times`;
        return `Each manager must appear exactly ${frequency}.`;
    }

    return null;
}

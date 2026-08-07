export function buildSettingsPayload(values, user) {
    const payload = {};
    if (values.name !== user.name) payload.name = values.name;
    if (values.username !== user.username) payload.username = values.username;
    if (values.teamName !== user.fantasyTeamName) payload.teamName = values.teamName;
    if (values.newPassword) {
        payload.currentPassword = values.currentPassword;
        payload.newPassword = values.newPassword;
    }
    return payload;
}

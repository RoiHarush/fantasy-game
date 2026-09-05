package com.fantasy.domain.team;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Stores the comparatively large logo payload away from the hot
 * {@code user_game_data} row. Most league requests only need the small
 * {@code teamLogoPresent} flag and version, so they no longer allocate every
 * manager's image while assembling unrelated responses.
 */
@Entity
@Table(name = "user_team_logos")
public class UserTeamLogoEntity {

    @Id
    @Column(name = "user_game_data_id")
    private Integer userGameDataId;

    @Column(name = "logo_bytes", nullable = false, columnDefinition = "BYTEA")
    private byte[] logoBytes;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    public Integer getUserGameDataId() { return userGameDataId; }
    public void setUserGameDataId(Integer userGameDataId) { this.userGameDataId = userGameDataId; }
    public byte[] getLogoBytes() { return logoBytes; }
    public void setLogoBytes(byte[] logoBytes) { this.logoBytes = logoBytes; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
}

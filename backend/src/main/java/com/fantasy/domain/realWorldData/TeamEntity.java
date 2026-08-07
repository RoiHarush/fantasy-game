package com.fantasy.domain.realWorldData;

import jakarta.persistence.*;

@Entity
@Table(name = "teams")
public class TeamEntity {
    @Id
    private int id;

    private String name;
    private String shortName;

    /** Internal team code. It deliberately mirrors the FPL team id. */
    private Integer code;

    /** FPL's stable club code, used only when building badge and kit asset URLs. */
    private Integer assetCode;

    public TeamEntity() {}

    public TeamEntity(int id, String name, String shortName, Integer assetCode) {
        this.id = id;
        this.name = name;
        this.shortName = shortName;
        this.code = id;
        this.assetCode = assetCode;
    }

    public int getId() { return id; }
    public void setId(int id) {
        this.id = id;
        this.code = id;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }
    public Integer getCode() { return code; }
    public void setCode(Integer code) {
        if (code == null || code != id) {
            throw new IllegalArgumentException("Team code must match team id");
        }
        this.code = code;
    }
    public Integer getAssetCode() { return assetCode; }
    public void setAssetCode(Integer assetCode) { this.assetCode = assetCode; }
}

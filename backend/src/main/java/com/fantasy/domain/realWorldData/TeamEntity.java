package com.fantasy.domain.realWorldData;

import jakarta.persistence.*;

@Entity
@Table(name = "teams")
public class TeamEntity {
    @Id
    private int id;

    private String name;
    private String shortName;

    public TeamEntity() {}

    public TeamEntity(int id, String name, String shortName) {
        this.id = id;
        this.name = name;
        this.shortName = shortName;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }
}

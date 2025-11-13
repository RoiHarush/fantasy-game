package com.fantasy.dto;

import java.util.List;

public class LeagueDto {
    private String name;
    private List<UserSummaryDto> users;

    public LeagueDto(String name, List<UserSummaryDto> users) {
        this.name = name;
        this.users = users;
    }

    public String getName() {
        return name;
    }

    public List<UserSummaryDto> getUsers() {
        return users;
    }
}
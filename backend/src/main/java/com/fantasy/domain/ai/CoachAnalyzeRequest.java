package com.fantasy.domain.ai;

import com.fantasy.domain.team.SquadDto;

public record CoachAnalyzeRequest(String mode, SquadDto draftSquad) {}

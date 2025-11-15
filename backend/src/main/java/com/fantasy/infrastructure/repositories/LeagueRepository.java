package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.league.LeagueEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeagueRepository extends JpaRepository<LeagueEntity, Long> {
}



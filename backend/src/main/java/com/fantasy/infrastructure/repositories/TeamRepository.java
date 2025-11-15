package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.realWorldData.TeamEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamRepository extends JpaRepository<TeamEntity, Integer> {
}

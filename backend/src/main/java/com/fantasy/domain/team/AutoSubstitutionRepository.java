package com.fantasy.domain.team;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AutoSubstitutionRepository extends JpaRepository<AutoSubstitutionEntity, Long> {
    List<AutoSubstitutionEntity> findBySquad_IdOrderBySequenceAsc(Long squadId);
}

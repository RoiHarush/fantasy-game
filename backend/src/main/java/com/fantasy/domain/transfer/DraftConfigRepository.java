package com.fantasy.domain.transfer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DraftConfigRepository extends JpaRepository<DraftConfig, Integer> {
}
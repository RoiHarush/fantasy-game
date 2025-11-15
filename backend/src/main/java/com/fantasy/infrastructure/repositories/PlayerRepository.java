package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.player.PlayerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlayerRepository extends JpaRepository<PlayerEntity, Integer> {
    Optional<PlayerEntity> findByFirstNameAndLastName(String firstName, String lastName);
    Optional<PlayerEntity> findByViewName(String viewName); // השם שמוצג באתר
    Optional<PlayerEntity> findById(Integer id);
}

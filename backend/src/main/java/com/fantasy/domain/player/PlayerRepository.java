package com.fantasy.domain.player;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerRepository extends JpaRepository<PlayerEntity, Integer> {
    Optional<PlayerEntity> findByFirstNameAndLastName(String firstName, String lastName);
    Optional<PlayerEntity> findByViewName(String viewName);
    Optional<PlayerEntity> findById(Integer id);
    List<PlayerEntity> findByState(PlayerState state);
}

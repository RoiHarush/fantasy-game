package com.fantasy.domain.game;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface GameweekDailyStatusRepository extends JpaRepository<GameweekDailyStatus, Long> {

    Optional<GameweekDailyStatus> findByGameweekIdAndMatchDate(Integer gameweekId, LocalDate matchDate);
}

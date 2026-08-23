package com.fantasy.domain.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AiCoachThreadRepository extends JpaRepository<AiCoachThreadEntity, Long> {
    Optional<AiCoachThreadEntity> findByUser_IdAndGameweek(int userId, int gameweek);
    void deleteByUser_IdAndGameweekLessThan(int userId, int gameweek);
}

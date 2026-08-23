package com.fantasy.domain.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface AiCoachUsageRepository extends JpaRepository<AiCoachUsageEntity, Long> {
    long countByUser_IdAndUsageTypeAndCreatedAtGreaterThanEqual(int userId, String usageType, LocalDateTime since);
    long countByUser_IdAndGameweekAndUsageType(int userId, int gameweek, String usageType);
}

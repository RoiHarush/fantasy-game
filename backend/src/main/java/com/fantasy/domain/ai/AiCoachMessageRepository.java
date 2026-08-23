package com.fantasy.domain.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiCoachMessageRepository extends JpaRepository<AiCoachMessageEntity, Long> {
    List<AiCoachMessageEntity> findByThread_IdOrderByCreatedAtAsc(long threadId);
}

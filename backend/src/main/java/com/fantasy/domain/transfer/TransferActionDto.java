package com.fantasy.domain.transfer;

import java.time.LocalDateTime;

public record TransferActionDto(
        long id,
        int gameWeekId,
        int userId,
        String userName,
        TransferWindowType windowType,
        TransferActionSource source,
        int playerInId,
        Integer playerOutId,
        LocalDateTime createdAt
) {}

package com.fantasy.domain.trade;

import java.time.LocalDateTime;
import java.util.List;

public final class TradeDtos {
    private TradeDtos() {}

    public record CreateTradeOfferRequest(int recipientUserId,
                                          List<CreateTradeItemRequest> items,
                                          String message) {}

    public record CreateTradeItemRequest(int offeredPlayerId, int requestedPlayerId) {}

    public record PlayerOption(int id, String name, String position, Integer teamId, String photo) {}

    public record ManagerOption(int userId,
                                String userName,
                                String teamName,
                                long teamLogoVersion,
                                List<PlayerOption> players) {}

    public record TradeContext(long leagueId,
                               int currentUserId,
                               boolean available,
                               String blockedReason,
                               List<ManagerOption> managers) {}

    public record ManagerSummary(int userId, String userName, String teamName, long teamLogoVersion) {}

    public record TradeItem(PlayerOption offeredPlayer, PlayerOption requestedPlayer) {}

    public record TradeOffer(long id,
                             String status,
                             ManagerSummary proposer,
                             ManagerSummary recipient,
                             List<TradeItem> items,
                             String message,
                             LocalDateTime createdAt,
                             LocalDateTime respondedAt,
                             boolean canAccept,
                             boolean canReject,
                             boolean canCancel) {}

    public record TradeOffers(List<TradeOffer> incoming, List<TradeOffer> outgoing) {}
}


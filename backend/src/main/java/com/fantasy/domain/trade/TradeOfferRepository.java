package com.fantasy.domain.trade;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TradeOfferRepository extends JpaRepository<TradeOfferEntity, Long> {
    @Query("""
        select distinct o from TradeOfferEntity o
        join fetch o.proposer
        join fetch o.recipient
        left join fetch o.items i
        left join fetch i.proposerPlayer
        left join fetch i.recipientPlayer
        where o.league.id = :leagueId
          and (o.proposer.id = :userId or o.recipient.id = :userId)
        order by o.createdAt desc
        """)
    List<TradeOfferEntity> findVisibleOffers(@Param("leagueId") long leagueId,
                                             @Param("userId") int userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select distinct o from TradeOfferEntity o
        join fetch o.proposer
        join fetch o.recipient
        left join fetch o.items i
        left join fetch i.proposerPlayer
        left join fetch i.recipientPlayer
        where o.id = :offerId
        """)
    Optional<TradeOfferEntity> findByIdForUpdate(@Param("offerId") long offerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select distinct o from TradeOfferEntity o
        left join fetch o.items i
        where o.league.id = :leagueId and o.status = :status
        """)
    List<TradeOfferEntity> findPendingByLeagueForUpdate(@Param("leagueId") long leagueId,
                                                        @Param("status") TradeOfferStatus status);
}

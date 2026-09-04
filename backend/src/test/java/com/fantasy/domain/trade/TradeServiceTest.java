package com.fantasy.domain.trade;

import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.transfer.LeagueTransferWindowRepository;
import com.fantasy.domain.transfer.TransferWindowStatus;
import com.fantasy.domain.user.UserEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TradeServiceTest {

    @Mock private TradeOfferRepository offerRepo;
    @Mock private LeagueRepository leagueRepo;
    @Mock private LeagueAccessService leagueAccessService;
    @Mock private UserGameDataRepository gameDataRepo;
    @Mock private UserSquadRepository squadRepo;
    @Mock private PlayerRepository playerRepo;
    @Mock private GameWeekRepository gameWeekRepo;
    @Mock private LeagueTransferWindowRepository windowRepo;
    @Mock private TradeWebSocketController webSocket;
    @Mock private ApplicationEventPublisher events;

    private TradeService service;
    private LeagueEntity league;
    private UserGameDataEntity proposerData;
    private UserGameDataEntity recipientData;
    private List<PlayerEntity> players;

    @BeforeEach
    void setUp() {
        service = new TradeService(offerRepo, leagueRepo, leagueAccessService,
                gameDataRepo, squadRepo, playerRepo, gameWeekRepo, windowRepo, webSocket, events);

        league = new LeagueEntity();
        league.setId(7L);
        league.setStatus(LeagueStatus.ACTIVE);

        players = new ArrayList<>();
        for (int id = 1; id <= 30; id++) {
            PlayerEntity player = new PlayerEntity();
            player.setId(id);
            player.setViewName("Player " + id);
            player.setPosition(id == 1 || id == 16 ? PlayerPosition.FORWARD : PlayerPosition.MIDFIELDER);
            player.setTeamId(id);
            players.add(player);
        }

        proposerData = gameData(11, "Proposer", "Purple XI", 1);
        recipientData = gameData(22, "Recipient", "Cyan XI", 16);
        recipientData.getNextSquad().getStartingLineup().set(0, 27);
        recipientData.getNextSquad().getBenchMap().put("B1", 16);
        recipientData.getNextSquad().setCaptainId(17);

        when(windowRepo.existsByLeague_IdAndStatus(7L, TransferWindowStatus.OPEN)).thenReturn(false);
        lenient().when(gameWeekRepo.findAll()).thenReturn(List.of());
        lenient().when(playerRepo.findById(any())).thenAnswer(invocation -> player(invocation.getArgument(0)));
        lenient().when(playerRepo.findAllById(any())).thenReturn(players);
        lenient().when(gameDataRepo.findByUserId(11)).thenReturn(Optional.of(proposerData));
        lenient().when(gameDataRepo.findByUserId(22)).thenReturn(Optional.of(recipientData));
    }

    @Test
    void acceptingOfferSwapsSlotsAndCaptainAndInvalidatesOverlappingOffers() {
        TradeOfferEntity accepted = offer(41L, proposerData.getUser(), recipientData.getUser(), 1, 16);
        TradeOfferEntity competing = offer(42L, proposerData.getUser(), recipientData.getUser(), 1, 16);

        when(offerRepo.findById(41L)).thenReturn(Optional.of(accepted));
        when(leagueRepo.findByIdWithLock(7L)).thenReturn(Optional.of(league));
        when(offerRepo.findByIdForUpdate(41L)).thenReturn(Optional.of(accepted));
        when(gameDataRepo.findAllByLeagueIdForUpdate(7L)).thenReturn(List.of(proposerData, recipientData));
        when(offerRepo.findPendingByLeagueForUpdate(7L, TradeOfferStatus.PENDING))
                .thenReturn(List.of(accepted, competing));

        TradeDtos.TradeOffer result = service.accept(22, 41L);

        assertThat(result.status()).isEqualTo("ACCEPTED");
        assertThat(proposerData.getNextSquad().getStartingLineup())
                .contains(16).doesNotContain(1);
        assertThat(proposerData.getNextSquad().getCaptainId()).isEqualTo(16);
        assertThat(recipientData.getNextSquad().getBenchMap())
                .containsEntry("B1", 1).doesNotContainValue(16);
        assertThat(competing.getStatus()).isEqualTo(TradeOfferStatus.INVALIDATED);
        verify(squadRepo).save(proposerData.getNextSquad());
        verify(squadRepo).save(recipientData.getNextSquad());
        verify(webSocket).sendChanged(7L, 41L, "ACCEPTED");
        verify(webSocket).sendChanged(7L, 42L, "INVALIDATED");
    }

    @Test
    void acceptingOfferIsBlockedWhileAWindowIsOpenWithoutChangingSquads() {
        TradeOfferEntity offer = offer(41L, proposerData.getUser(), recipientData.getUser(), 1, 16);
        when(offerRepo.findById(41L)).thenReturn(Optional.of(offer));
        when(leagueRepo.findByIdWithLock(7L)).thenReturn(Optional.of(league));
        when(offerRepo.findByIdForUpdate(41L)).thenReturn(Optional.of(offer));
        when(windowRepo.existsByLeague_IdAndStatus(7L, TransferWindowStatus.OPEN)).thenReturn(true);

        assertThatThrownBy(() -> service.accept(22, 41L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("window is open");

        assertThat(proposerData.getNextSquad().getStartingLineup()).contains(1).doesNotContain(16);
        assertThat(recipientData.getNextSquad().getBenchMap()).containsEntry("B1", 16);
        verifyNoInteractions(squadRepo);
    }

    private UserGameDataEntity gameData(int userId, String userName, String teamName, int firstPlayerId) {
        UserEntity user = new UserEntity();
        user.setId(userId);
        user.setName(userName);

        UserSquadEntity squad = new UserSquadEntity();
        List<Integer> lineup = new ArrayList<>();
        for (int offset = 0; offset < 11; offset++) lineup.add(firstPlayerId + offset);
        squad.setStartingLineup(lineup);
        LinkedHashMap<String, Integer> bench = new LinkedHashMap<>();
        for (int offset = 11; offset < 15; offset++) bench.put("B" + (offset - 10), firstPlayerId + offset);
        squad.setBenchMap(bench);
        squad.setCaptainId(firstPlayerId);
        squad.setViceCaptainId(firstPlayerId + 1);

        UserGameDataEntity data = new UserGameDataEntity();
        data.setUser(user);
        data.setLeague(league);
        data.setFantasyTeamName(teamName);
        data.setNextSquad(squad);
        squad.setUser(data);
        return data;
    }

    private TradeOfferEntity offer(long id,
                                   UserEntity proposer,
                                   UserEntity recipient,
                                   int offeredPlayerId,
                                   int requestedPlayerId) {
        TradeOfferEntity offer = new TradeOfferEntity();
        ReflectionTestUtils.setField(offer, "id", id);
        offer.setLeague(league);
        offer.setProposer(proposer);
        offer.setRecipient(recipient);
        TradeOfferItemEntity item = new TradeOfferItemEntity();
        item.setProposerPlayer(player(offeredPlayerId).orElseThrow());
        item.setRecipientPlayer(player(requestedPlayerId).orElseThrow());
        offer.addItem(item);
        return offer;
    }

    private Optional<PlayerEntity> player(int id) {
        return players.stream().filter(player -> player.getId() == id).findFirst();
    }
}

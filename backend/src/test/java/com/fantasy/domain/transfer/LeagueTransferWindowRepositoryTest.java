package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class LeagueTransferWindowRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private LeagueTransferWindowRepository repository;

    @Test
    void reloadsOpenWindowAndCurrentTurnFromDatabase() {
        UserEntity admin = new UserEntity();
        admin.setUsername("admin@example.com");
        admin.setPassword("encoded-password");
        admin.setName("League Admin");
        admin.setRegisteredAt(LocalDateTime.now());
        admin.setRole(UserRole.ROLE_USER);
        entityManager.persist(admin);

        LeagueEntity league = new LeagueEntity();
        league.setName("Test League");
        league.setLeagueCode("ABC123");
        league.setAdmin(admin);
        league.setUsers(List.of(admin));
        entityManager.persist(league);

        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(4);
        gameWeek.setName("Gameweek 4");
        gameWeek.setStatus("UPCOMING");
        entityManager.persist(gameWeek);

        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setWindowType(TransferWindowType.TRANSFER);
        window.setTurnOrder(List.of(admin.getId(), admin.getId()));
        window.open(List.of());
        entityManager.persistAndFlush(window);

        window.advanceTurn();
        entityManager.flush();
        entityManager.clear();

        LeagueTransferWindowEntity reloaded = repository
                .findByLeagueAndStatusForUpdate(league.getId(), TransferWindowStatus.OPEN)
                .getFirst();

        assertEquals(admin.getId(), reloaded.currentUserId().orElseThrow());
        assertEquals(1, reloaded.getRegularCursor());
        assertEquals(List.of(admin.getId()), reloaded.remainingOrder());
        assertEquals(1, reloaded.turnsUsed().get(admin.getId()));
    }
}

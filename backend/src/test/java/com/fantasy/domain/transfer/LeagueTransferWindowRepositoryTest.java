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
import java.util.ArrayList;
import java.util.Collections;
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
        admin.setEmail("admin@example.com");
        admin.setEmailVerified(true);
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

    @Test
    void reloadsTheFullInitialSnakeOrderAtTheExactPersistedTurn() {
        List<UserEntity> managers = new ArrayList<>();
        for (int index = 1; index <= 7; index++) {
            UserEntity manager = new UserEntity();
            manager.setUsername("manager" + index + "@example.com");
            manager.setEmail("manager" + index + "@example.com");
            manager.setEmailVerified(true);
            manager.setPassword("encoded-password");
            manager.setName("Manager " + index);
            manager.setRegisteredAt(LocalDateTime.now());
            manager.setRole(UserRole.ROLE_USER);
            managers.add(entityManager.persist(manager));
        }

        LeagueEntity league = new LeagueEntity();
        league.setName("Seven Manager League");
        league.setLeagueCode("SNAKE7");
        league.setAdmin(managers.getFirst());
        league.setUsers(managers);
        entityManager.persist(league);

        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(8);
        gameWeek.setName("Gameweek 8");
        gameWeek.setStatus("UPCOMING");
        entityManager.persist(gameWeek);

        List<Integer> baseOrder = List.of(
                managers.get(3).getId(), managers.get(0).getId(), managers.get(6).getId(),
                managers.get(1).getId(), managers.get(5).getId(), managers.get(2).getId(),
                managers.get(4).getId()
        );
        List<Integer> snakeOrder = new ArrayList<>();
        for (int round = 0; round < 15; round++) {
            List<Integer> roundOrder = new ArrayList<>(baseOrder);
            if (round % 2 == 1) Collections.reverse(roundOrder);
            snakeOrder.addAll(roundOrder);
        }

        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setWindowType(TransferWindowType.DRAFT);
        window.setTurnOrder(snakeOrder);
        window.setCanonicalOrder(snakeOrder);
        window.open(List.of());
        for (int completedPicks = 0; completedPicks < 23; completedPicks++) {
            window.advanceTurn();
        }
        entityManager.persistAndFlush(window);
        entityManager.clear();

        LeagueTransferWindowEntity reloaded = repository
                .findByLeagueAndStatusForUpdate(league.getId(), TransferWindowStatus.OPEN)
                .getFirst();

        assertEquals(105, reloaded.getTurnOrder().size());
        assertEquals(snakeOrder, reloaded.getTurnOrder());
        assertEquals(snakeOrder, reloaded.getCanonicalOrder());
        assertEquals(23, reloaded.getRegularCursor());
        assertEquals(snakeOrder.get(23), reloaded.currentUserId().orElseThrow());
        assertEquals(snakeOrder.subList(23, 105), reloaded.remainingOrder());
    }
}

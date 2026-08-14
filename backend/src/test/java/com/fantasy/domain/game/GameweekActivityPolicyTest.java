package com.fantasy.domain.game;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GameweekActivityPolicyTest {

    private static final LocalDateTime FIRST_KICKOFF = LocalDateTime.of(2026, 8, 21, 22, 0);
    private static final LocalDateTime LAST_KICKOFF = LocalDateTime.of(2026, 8, 24, 22, 0);

    @Test
    void blocksImmediateOpenForLiveGameweekEvenAfterExpectedSettlementTime() {
        GameWeekEntity gameweek = gameweek("LIVE", false);

        var error = assertThrows(
                GameweekActivityPolicy.GameweekActiveException.class,
                () -> GameweekActivityPolicy.requireCanOpenNow(
                        List.of(gameweek),
                        LAST_KICKOFF.plusDays(1),
                        "Draft opening"
                )
        );

        assertEquals("Draft opening is unavailable while Gameweek 1 is active", error.getMessage());
    }

    @Test
    void blocksScheduleFromFirstKickoffUntilExpectedSettlement() {
        GameWeekEntity gameweek = gameweek("UPCOMING", false);

        assertThrows(
                GameweekActivityPolicy.GameweekActiveException.class,
                () -> GameweekActivityPolicy.requireCanScheduleAt(
                        List.of(gameweek),
                        FIRST_KICKOFF.plusHours(2),
                        "Draft scheduling"
                )
        );
        assertThrows(
                GameweekActivityPolicy.GameweekActiveException.class,
                () -> GameweekActivityPolicy.requireCanScheduleAt(
                        List.of(gameweek),
                        LAST_KICKOFF.plusHours(3).plusMinutes(59),
                        "Draft scheduling"
                )
        );
    }

    @Test
    void allowsScheduleBeforeKickoffOrAtSettlementBoundary() {
        GameWeekEntity gameweek = gameweek("UPCOMING", false);

        assertDoesNotThrow(() -> GameweekActivityPolicy.requireCanScheduleAt(
                List.of(gameweek),
                FIRST_KICKOFF.minusMinutes(1),
                "Draft scheduling"
        ));
        assertDoesNotThrow(() -> GameweekActivityPolicy.requireCanScheduleAt(
                List.of(gameweek),
                LAST_KICKOFF.plusHours(4),
                "Draft scheduling"
        ));
    }

    @Test
    void allowsOpeningAfterTheLiveGameweekWasCalculated() {
        GameWeekEntity settled = gameweek("LIVE", true);

        assertDoesNotThrow(() -> GameweekActivityPolicy.requireCanOpenNow(
                List.of(settled),
                LAST_KICKOFF.plusHours(4),
                "Transfer-window opening"
        ));
    }

    private GameWeekEntity gameweek(String status, boolean calculated) {
        GameWeekEntity gameweek = new GameWeekEntity(
                1,
                "Gameweek 1",
                FIRST_KICKOFF,
                LAST_KICKOFF,
                status
        );
        gameweek.setCalculated(calculated);
        return gameweek;
    }
}

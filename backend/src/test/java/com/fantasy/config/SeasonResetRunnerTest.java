package com.fantasy.config;

import com.fantasy.application.SeasonResetService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class SeasonResetRunnerTest {

    @Test
    void refusesResetWithoutExactConfirmation() {
        SeasonResetService service = mock(SeasonResetService.class);
        var runner = new SeasonResetRunner(service, "wrong", false);

        assertThrows(
                IllegalStateException.class,
                () -> runner.run(new DefaultApplicationArguments())
        );
        verifyNoInteractions(service);
    }

    @Test
    void refusesResetWhileSchedulersAreEnabled() {
        SeasonResetService service = mock(SeasonResetService.class);
        var runner = new SeasonResetRunner(
                service,
                SeasonResetRunner.REQUIRED_CONFIRMATION,
                true
        );

        assertThrows(
                IllegalStateException.class,
                () -> runner.run(new DefaultApplicationArguments())
        );
        verifyNoInteractions(service);
    }

    @Test
    void runsOnlyWithBothSafetyConditionsSatisfied() throws Exception {
        SeasonResetService service = mock(SeasonResetService.class);
        when(service.resetAllData()).thenReturn(new SeasonResetService.ResetSummary(42, 30));
        var runner = new SeasonResetRunner(
                service,
                SeasonResetRunner.REQUIRED_CONFIRMATION,
                false
        );

        runner.run(new DefaultApplicationArguments());

        verify(service).resetAllData();
    }
}

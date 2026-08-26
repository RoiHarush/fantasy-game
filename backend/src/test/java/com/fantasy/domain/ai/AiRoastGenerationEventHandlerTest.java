package com.fantasy.domain.ai;

import org.junit.jupiter.api.Test;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class AiRoastGenerationEventHandlerTest {

    @Test
    void delegatesGenerationToTheDedicatedBackgroundScheduler() {
        ThreadPoolTaskScheduler scheduler = mock(ThreadPoolTaskScheduler.class);
        AiRoastService service = mock(AiRoastService.class);
        doAnswer(invocation -> {
            invocation.<Runnable>getArgument(0).run();
            return null;
        }).when(scheduler).execute(any(Runnable.class));
        AiRoastGenerationEventHandler handler = new AiRoastGenerationEventHandler(scheduler, service);

        handler.onGenerationRequested(new AiRoastGenerationRequestedEvent(9L, 5, true));

        verify(service).refreshForLeague(9L, 5, true);
    }
}

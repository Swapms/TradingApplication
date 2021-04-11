package com.db.tradeApp.scheduler;

import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.verify;

import org.awaitility.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import com.db.tradeApp.TradeApplication;

@SpringJUnitConfig(TradeApplication.class)
@ExtendWith(SpringExtension.class)
@SpringBootTest
class TradeSchedulerTest {

	@SpyBean
    private TradeScheduler TradeScheduler;

    @Test
    public void whenWaitOneSecond_thenScheduledIsCalledAtLeastTenTimes() {
        await()
                .atMost(Duration.TWO_MINUTES)
                .untilAsserted(() -> verify(TradeScheduler,atLeast(4)).tradeCronScheduler());
    }

}

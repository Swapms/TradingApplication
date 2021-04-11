package com.db.tradeApp.scheduler;

import java.util.Calendar;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.db.tradeApp.service.TradeService;
/**
 * Class to schedule cron job
 * @author Swapnali
 *
 */

@Component
public class TradeScheduler {

	@Autowired
	TradeService tradeService;
	
	private static final Logger logger = LoggerFactory.getLogger(TradeScheduler.class);
	
	@Scheduled(cron = "${trade.schedule}")
	public void tradeCronScheduler() throws Exception {
		logger.info("Time is :" + Calendar.getInstance().getTime());
		tradeService.updateExpiryFlagOfTrade();
	}
	
}

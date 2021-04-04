package com.db.tradeApp;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.db.tradeApp.controller.TradeController;
import com.db.tradeApp.exception.InvalidTradeException;
import com.db.tradeApp.model.Trade;


@SpringBootTest
class TradeApplicationTests {

	@Test
	void contextLoads() {
	}
	@Autowired
	private TradeController tradeController;

	@Test
	void testValidTrade() {
		ResponseEntity responseEntity = tradeController.tradeValidateStore(createNewTrade("T1",2,LocalDate.now()));
		Assertions.assertEquals(ResponseEntity.status(HttpStatus.OK).build(),responseEntity);
		List<Trade> tradeList =tradeController.findAllTrades();
		Assertions.assertEquals(1, tradeList.size());
		Assertions.assertEquals("T1",tradeList.get(0).getTradeId());
	}

	@Test
	void testTradeValidateAndStoreWhenMaturityDatePast() {
		try {
			LocalDate localDate = LocalDate.of(2019,07,01);
			ResponseEntity responseEntity = tradeController.tradeValidateStore(createNewTrade("T2", 1, localDate));
		}catch (InvalidTradeException ie) {
			Assertions.assertEquals("Invalid Trade: T2  Trade Id is not found", ie.getMessage());
		}
	}

	@Test
	void testTradeValidateAndStoreWhenOldVersion() {
		// step-1 create trade
		ResponseEntity responseEntity = tradeController.tradeValidateStore(createNewTrade("T1",2,LocalDate.now()));
		Assertions.assertEquals(ResponseEntity.status(HttpStatus.OK).build(),responseEntity);
		List<Trade> tradeList =tradeController.findAllTrades();
		Assertions.assertEquals(1, tradeList.size());
		Assertions.assertEquals("T1",tradeList.get(0).getTradeId());
		Assertions.assertEquals(2,tradeList.get(0).getVersion());

		//step-2 create trade with old version
		try {
			ResponseEntity responseEntity1 = tradeController.tradeValidateStore(createNewTrade("T1", 1, LocalDate.now()));


		}catch (InvalidTradeException e){
			System.out.println("Trade with old version");
			System.out.println(e.getId());
			System.out.println(e.getMessage());
		}
		List<Trade> tradeList1 =tradeController.findAllTrades();
		Assertions.assertEquals(1, tradeList1.size());
		Assertions.assertEquals("T1",tradeList1.get(0).getTradeId());
		Assertions.assertEquals(2,tradeList1.get(0).getVersion());
	}

	@Test
	void testTradeValidateAndStoreWhenSameVersionTrade(){
		ResponseEntity responseEntity = tradeController.tradeValidateStore(createNewTrade("T1",2,LocalDate.now()));
		Assertions.assertEquals(ResponseEntity.status(HttpStatus.OK).build(),responseEntity);
		List<Trade> tradeList =tradeController.findAllTrades();
		Assertions.assertEquals(1, tradeList.size());
		Assertions.assertEquals("T1",tradeList.get(0).getTradeId());
		Assertions.assertEquals(2,tradeList.get(0).getVersion());

		//step-2 create trade with same version
		Trade trade2 = createNewTrade("T1",2,LocalDate.now());
		trade2.setBookId("T1B1V2");
		ResponseEntity responseEntity2 = tradeController.tradeValidateStore(trade2);
		Assertions.assertEquals(ResponseEntity.status(HttpStatus.OK).build(),responseEntity2);
		List<Trade> tradeList2 =tradeController.findAllTrades();
		Assertions.assertEquals(1, tradeList2.size());
		Assertions.assertEquals("T1",tradeList2.get(0).getTradeId());
		Assertions.assertEquals(2,tradeList2.get(0).getVersion());
		Assertions.assertEquals("T1B1V2",tradeList2.get(0).getBookId());

		//step-2 create trade with new version
		Trade trade3 = createNewTrade("T1",2,LocalDate.now());
		trade3.setBookId("T1B1V3");
		ResponseEntity responseEntity3 = tradeController.tradeValidateStore(trade3);
		Assertions.assertEquals(ResponseEntity.status(HttpStatus.OK).build(),responseEntity3);
		List<Trade> tradeList3 =tradeController.findAllTrades();
		Assertions.assertEquals(1, tradeList3.size());
		Assertions.assertEquals("T1",tradeList3.get(0).getTradeId());
		Assertions.assertEquals(2,tradeList3.get(0).getVersion());
		Assertions.assertEquals("T1B1V3",tradeList3.get(0).getBookId());

	}
	private Trade createNewTrade(String tradeId,int version,LocalDate  maturityDate){
		Trade trade = new Trade();
		trade.setTradeId(tradeId);
		trade.setBookId(tradeId+"B1");
		trade.setVersion(version);
		trade.setCounterParty(tradeId+"cp");
		trade.setMaturityDate(maturityDate);
		trade.setExpiredFlag("Y");
		return trade;
	}

}

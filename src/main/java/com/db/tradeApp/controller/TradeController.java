package com.db.tradeApp.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.db.tradeApp.exception.InvalidTradeException;
import com.db.tradeApp.model.Trade;
import com.db.tradeApp.service.TradeService;

import java.util.List;

@RestController
public class TradeController {
	
	 private static final Logger log = LoggerFactory.getLogger(TradeController.class);
	 
    @Autowired
    TradeService tradeService;
    
    @PostMapping("/trade")
    public ResponseEntity<String> tradeValidateStore(@RequestBody Trade trade){
       
    	try {
    		// to check whether same trade with same version present
    	    Trade existingTrade = tradeService.UpdateTradeWithSameVersion(trade);
    	    if(existingTrade != null) {
    	    	//override the existing trade with same version
    	    	tradeService.persist(existingTrade);
    	    	log.info("Existing trade overrided with same version");
    	    }
    	    else if(tradeService.isValid(trade)) {
			   tradeService.persist(trade);
			   log.info("Trade Added with trade id :"+trade.getTradeId());
			}
    	    
		}catch (InvalidTradeException e) {
			log.error(e.getId()+e.getStackTrace());
		}
    	catch (Exception e) {
    		log.error(e.getMessage()+e.getStackTrace());
		}
        return ResponseEntity.status(HttpStatus.OK).build();
    }

    @GetMapping("/trade")
    public List<Trade> findAllTrades(){
        return tradeService.findAll();
    }
}

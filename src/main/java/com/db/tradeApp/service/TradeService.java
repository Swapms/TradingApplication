package com.db.tradeApp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.db.tradeApp.exception.InvalidTradeException;
import com.db.tradeApp.model.Trade;
import com.db.tradeApp.repo.TradeRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class TradeService {

    private static final Logger log = LoggerFactory.getLogger(TradeService.class);

  
    @Autowired
    TradeRepository tradeRepository;

    public Trade UpdateTradeWithSameVersion(Trade trade){
    	 if(validateMaturityDate(trade)) {
    		 Trade ExistingTrade = tradeRepository.findByTradeIdAndVersion(trade.getTradeId(),trade.getVersion());
    		 if(ExistingTrade == null)
    			 return null;
    		 else {
    			 trade.setId(ExistingTrade.getId());
    			 return trade;
    		 }
    	 }else {
        	 throw new InvalidTradeException(trade.getTradeId()+" Error : Invalid Maturity Date");
         }
    }
    public boolean isValid(Trade trade){
        if(validateMaturityDate(trade)) {
        	List<Trade> trades = tradeRepository.findByTradeIdOrderByVersionDesc(trade.getTradeId());
            if(trades != null && !trades.isEmpty()) {
                 return validateVersion(trade, trades.get(0));
            }else{
                 return true;
             }
         }else {
        	 throw new InvalidTradeException(trade.getTradeId()+" Error : Invalid Maturity Date");
         }
    }

    private boolean validateVersion(Trade trade,Trade oldTrade) {
        // lower version is being received by the store it will reject the trade and throw an exception.
        if(trade.getVersion() > oldTrade.getVersion()){
            return true;
        }else {
        	 throw new InvalidTradeException(trade.getTradeId()+" Error : Invalid Version specified, Highest version is :"+oldTrade.getVersion());
        }
    }
    //Store should not allow the trade which has less maturity date then today date
    private boolean validateMaturityDate(Trade trade){
        return trade.getMaturityDate().isBefore(LocalDate.now())  ? false:true;
    }
    
    //to save the trade
    public void  persist(Trade trade){
        trade.setCreatedDate(LocalDate.now());
        tradeRepository.save(trade);
    }

    public List<Trade> findAll(){
       return  tradeRepository.findAll();
    }
/*
 * To update the flag as per maturity date
 * 
 */
    public void updateExpiryFlagOfTrade(){
        tradeRepository.findAll().stream().forEach(t -> {
                if (!validateMaturityDate(t)) {
                    t.setExpiredFlag("Y");
                    log.info("Trade which needs to updated ", t);
                    tradeRepository.save(t);
                }
            });
    }
}

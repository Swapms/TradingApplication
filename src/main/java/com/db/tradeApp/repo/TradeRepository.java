package com.db.tradeApp.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.db.tradeApp.model.Trade;

@Repository
public interface TradeRepository extends JpaRepository<Trade,Long> {
	
	public List<Trade> findByTradeIdOrderByVersionDesc(String tradeId);
	public Trade findByTradeIdAndVersion(String tradeId,int version);
}

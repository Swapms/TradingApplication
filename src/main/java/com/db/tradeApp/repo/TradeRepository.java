package com.db.tradeApp.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.db.tradeApp.model.Trade;

@Repository
public interface TradeRepository extends JpaRepository<Trade,String> {
}

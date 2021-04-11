package com.db.tradeApp.exception;

public class InvalidTradeException extends RuntimeException {

    private final String id;
    
    public InvalidTradeException(final String id) {
        super("Invalid Trade: " + id);
        this.id = id;
    }

    public String getId() {
        return id;
    }
}

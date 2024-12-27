package com.adityachandel.booklore.model.stomp;

import lombok.Getter;

import java.time.Instant;


@Getter
public class LogNotification {

    private final Instant timestamp = Instant.now();
    private final String message;

    private LogNotification(String message) {
        this.message = message;
    }

    public static LogNotification createLogNotification(String message) {
        return new LogNotification(message);
    }
}

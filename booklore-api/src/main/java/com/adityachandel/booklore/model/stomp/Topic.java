package com.adityachandel.booklore.model.stomp;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public enum Topic {
    BOOK("/topic/book"),
    LOG("/topic/log");

    private final String path;

    @Override
    public String toString() {
        return path;
    }
}
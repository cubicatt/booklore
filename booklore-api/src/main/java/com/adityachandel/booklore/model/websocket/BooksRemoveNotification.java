package com.adityachandel.booklore.model.websocket;

import com.adityachandel.booklore.model.dto.Book;
import lombok.Data;

import java.util.Set;

@Data
public class BooksRemoveNotification {
    private Set<Long> removedBookIds;
}

package com.adityachandel.booklore.model.stomp;

import com.adityachandel.booklore.model.dto.BookDTO;
import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class BookNotification {

    private Action action;
    private BookDTO addedBook;
    private Set<Long> removedBookIds;

    public enum Action {
        BOOK_ADDED, BOOKS_REMOVED
    }
}

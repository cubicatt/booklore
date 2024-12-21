package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.model.dto.BookDTO;
import com.adityachandel.booklore.model.dto.ShelfDTO;
import com.adityachandel.booklore.model.entity.Book;

public class BookTransformer {

    public static BookDTO convertToBookDTO(Book book) {
        BookDTO bookDTO = new BookDTO();
        bookDTO.setId(book.getId());
        bookDTO.setLibraryId(book.getLibrary().getId());
        bookDTO.setFileName(book.getFileName());
        bookDTO.setLastReadTime(book.getLastReadTime());
        bookDTO.setAddedOn(book.getAddedOn());
        bookDTO.setMetadata(BookMetadataTransformer.convertToBookDTO(book.getMetadata()));
        bookDTO.setShelves(book.getShelves() == null ? null : book.getShelves().stream().map(ShelfTransformer::convertToShelfDTO).toList());
        return bookDTO;
    }
}

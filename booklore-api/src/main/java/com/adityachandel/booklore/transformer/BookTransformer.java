package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.dto.BookDTO;
import com.adityachandel.booklore.entity.Book;

import java.util.stream.Collectors;

public class BookTransformer {

    public static BookDTO convertToBookDTO(Book book) {
        BookDTO bookDTO = new BookDTO();
        bookDTO.setId(book.getId());
        bookDTO.setLibraryId(book.getLibrary().getId());
        bookDTO.setFileName(book.getFileName());
        bookDTO.setTitle(book.getTitle());
        bookDTO.setAuthors(book.getAuthors().stream().map(AuthorTransformer::toAuthorDTO).collect(Collectors.toList()));
        return bookDTO;
    }
}

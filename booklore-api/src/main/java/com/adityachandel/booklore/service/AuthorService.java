package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.dto.AuthorDTO;
import com.adityachandel.booklore.model.entity.Author;
import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.repository.AuthorRepository;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.transformer.AuthorTransformer;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class AuthorService {

    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;

    public AuthorDTO getAuthorById(Long id) {
        Author author = authorRepository.findById(id).orElseThrow(() -> ApiError.AUTHOR_NOT_FOUND.createException(id));
        return AuthorTransformer.toAuthorDTO(author);
    }

    public List<AuthorDTO> getAuthorsByBookId(Long bookId) {
        bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        List<Author> authors = authorRepository.findAuthorsByBookId(bookId);
        return authors.stream().map(AuthorTransformer::toAuthorDTO).toList();
    }
}



package com.adityachandel.booklore.service;

import com.adityachandel.booklore.mapper.AuthorMapper;
import com.adityachandel.booklore.model.dto.Author;
import com.adityachandel.booklore.model.entity.AuthorEntity;
import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.repository.AuthorRepository;
import com.adityachandel.booklore.repository.BookRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class AuthorService {

    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;
    private final AuthorMapper authorMapper;

    public Author getAuthorById(Long id) {
        AuthorEntity authorEntity = authorRepository.findById(id).orElseThrow(() -> ApiError.AUTHOR_NOT_FOUND.createException(id));
        return authorMapper.toAuthor(authorEntity);
    }

    public List<Author> getAuthorsByBookId(Long bookId) {
        bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        List<AuthorEntity> authorEntities = authorRepository.findAuthorsByBookId(bookId);
        return authorEntities.stream().map(authorMapper::toAuthor).toList();
    }
}



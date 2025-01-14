package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.repository.BookRepository;
import lombok.AllArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;

@AllArgsConstructor
@Service
public class EpubService {

    private final BookRepository bookRepository;

    public ByteArrayResource getEpubFile(Long bookId) throws IOException {
        BookEntity bookEntity = bookRepository.findById(bookId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        try (FileInputStream inputStream = new FileInputStream(bookEntity.getPath())) {
            byte[] fileContent = inputStream.readAllBytes();
            return new ByteArrayResource(fileContent);
        }
    }
}
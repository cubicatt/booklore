package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.entity.AuthorEntity;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.BookMetadataEntity;
import com.adityachandel.booklore.model.entity.BookViewerSettingEntity;
import com.adityachandel.booklore.model.enums.BookFileType;
import com.adityachandel.booklore.repository.AuthorRepository;
import com.adityachandel.booklore.repository.BookMetadataRepository;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.BookViewerSettingRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Optional;
import java.util.Set;

@Service
@AllArgsConstructor
public class BookCreatorService {

    private AuthorRepository authorRepository;
    private BookRepository bookRepository;
    private BookMetadataRepository bookMetadataRepository;
    private BookViewerSettingRepository bookViewerSettingRepository;

    public BookEntity createShellBook(LibraryFile libraryFile, BookFileType bookFileType) {
        File bookFile = new File(libraryFile.getFilePath());
        BookEntity bookEntity = BookEntity.builder()
                .library(libraryFile.getLibraryEntity())
                .path(bookFile.getPath())
                .fileName(bookFile.getName())
                .bookType(bookFileType)
                .build();
        BookMetadataEntity bookMetadataEntity = BookMetadataEntity.builder().build();
        BookViewerSettingEntity bookViewerSetting = BookViewerSettingEntity.builder()
                .book(bookEntity)
                .bookId(bookEntity.getId())
                .build();
        bookEntity.setMetadata(bookMetadataEntity);
        bookEntity.setViewerSetting(bookViewerSetting);
        bookEntity.setAddedOn(Instant.now());
        bookEntity = bookRepository.saveAndFlush(bookEntity);
        return bookEntity;
    }

    public void addAuthorsToBook(Set<String> authors, BookEntity bookEntity) {
        for (String authorStr : authors) {
            Optional<AuthorEntity> authorOptional = authorRepository.findByName(authorStr);
            AuthorEntity authorEntity;
            if (authorOptional.isPresent()) {
                authorEntity = authorOptional.get();
            } else {
                authorEntity = AuthorEntity.builder()
                        .name(authorStr)
                        .build();
                authorEntity = authorRepository.save(authorEntity);
            }
            if (bookEntity.getMetadata().getAuthors() == null) {
                bookEntity.getMetadata().setAuthors(new ArrayList<>());
            }
            bookEntity.getMetadata().getAuthors().add(authorEntity);
        }
    }

    public void saveConnections(BookEntity bookEntity) {
        if (bookEntity.getMetadata().getAuthors() != null && !bookEntity.getMetadata().getAuthors().isEmpty()) {
            authorRepository.saveAll(bookEntity.getMetadata().getAuthors());
        }
        bookRepository.save(bookEntity);
        bookMetadataRepository.save(bookEntity.getMetadata());
        bookViewerSettingRepository.save(bookEntity.getViewerSetting());
    }
}

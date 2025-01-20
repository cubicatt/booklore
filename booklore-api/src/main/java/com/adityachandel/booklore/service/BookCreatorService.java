package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.entity.*;
import com.adityachandel.booklore.model.enums.BookFileType;
import com.adityachandel.booklore.repository.*;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@AllArgsConstructor
public class BookCreatorService {

    private AuthorRepository authorRepository;
    private CategoryRepository categoryRepository;
    private BookRepository bookRepository;
    private BookMetadataRepository bookMetadataRepository;
    private PdfViewerPreferencesRepository pdfViewerPreferencesRepository;
    private EpubViewerPreferencesRepository epubViewerPreferencesRepository;

    public BookEntity createShellBook(LibraryFile libraryFile, BookFileType bookFileType) {
        BookEntity bookEntity = BookEntity.builder()
                .library(libraryFile.getLibraryEntity())
                .libraryPath(libraryFile.getLibraryPathEntity())
                .fileName(libraryFile.getFileName())
                .fileSubPath(libraryFile.getFileSubPath())
                .bookType(bookFileType)
                .addedOn(Instant.now())
                .build();
        BookMetadataEntity bookMetadataEntity = BookMetadataEntity.builder().build();
        if (bookFileType == BookFileType.PDF) {
            PdfViewerPreferencesEntity pdfViewerPreferencesEntity = PdfViewerPreferencesEntity.builder()
                    .book(bookEntity)
                    .bookId(bookEntity.getId())
                    .build();
            bookEntity.setPdfViewerPrefs(pdfViewerPreferencesEntity);
        } else if (bookFileType == BookFileType.EPUB) {
            EpubViewerPreferencesEntity epubViewerPreferencesEntity = EpubViewerPreferencesEntity.builder()
                    .book(bookEntity)
                    .bookId(bookEntity.getId())
                    .build();
            bookEntity.setEpubViewerPrefs(epubViewerPreferencesEntity);
        }
        bookEntity.setMetadata(bookMetadataEntity);
        bookEntity = bookRepository.saveAndFlush(bookEntity);

        return bookEntity;
    }

    public void addCategoriesToBook(List<String> categories, BookEntity bookEntity) {
        for (String category : categories) {
            Optional<CategoryEntity> catOpt = categoryRepository.findByName(category);
            CategoryEntity categoryEntity;
            if (catOpt.isPresent()) {
                categoryEntity = catOpt.get();
            } else {
                categoryEntity = CategoryEntity.builder()
                        .name(category)
                        .build();
                categoryEntity = categoryRepository.save(categoryEntity);
            }
            if (bookEntity.getMetadata().getCategories() == null) {
                bookEntity.getMetadata().setCategories(new ArrayList<>());
            }
            bookEntity.getMetadata().getCategories().add(categoryEntity);
        }
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
        if (bookEntity.getBookType() == BookFileType.EPUB) {
            epubViewerPreferencesRepository.save(bookEntity.getEpubViewerPrefs());
        } else if (bookEntity.getBookType() == BookFileType.PDF) {
            pdfViewerPreferencesRepository.save(bookEntity.getPdfViewerPrefs());
        }
    }
}

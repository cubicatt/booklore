package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.entity.Author;
import com.adityachandel.booklore.model.entity.Book;
import com.adityachandel.booklore.model.entity.BookMetadata;
import com.adityachandel.booklore.model.entity.BookViewerSetting;
import com.adityachandel.booklore.repository.AuthorRepository;
import com.adityachandel.booklore.repository.BookMetadataRepository;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.BookViewerSettingRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
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

    public Book createShellBook(LibraryFile libraryFile) {
        File bookFile = new File(libraryFile.getFilePath());
        Book book = Book.builder().library(libraryFile.getLibrary()).path(bookFile.getPath()).fileName(bookFile.getName()).build();
        BookMetadata bookMetadata = BookMetadata.builder().build();
        BookViewerSetting bookViewerSetting = BookViewerSetting.builder()
                .book(book)
                .bookId(book.getId())
                .pageNumber(1)
                .sidebar_visible(true)
                .spread("odd")
                .zoom("page-fit")
                .build();
        book.setMetadata(bookMetadata);
        book.setViewerSetting(bookViewerSetting);
        return book;
    }

    public void addAuthorsToBook(Set<String> authors, Book book) {
        for (String authorSrt : authors) {
            Optional<Author> authorOptional = authorRepository.findByName(authorSrt);
            Author author;
            if (authorOptional.isPresent()) {
                author = authorOptional.get();
                if(book.getMetadata().getAuthors() == null) {
                    book.getMetadata().setAuthors(new ArrayList<>());
                }
                book.getMetadata().getAuthors().add(author);
            } else {
                author = Author.builder()
                        .name(authorSrt)
                        .build();
                author.setBookMetadataList(new ArrayList<>());
                book.getMetadata().setAuthors(new ArrayList<>());
                book.getMetadata().getAuthors().add(author);
            }
        }
    }

    public void saveConnections(Book book) {
        if (book.getMetadata().getAuthors() != null && !book.getMetadata().getAuthors().isEmpty()) {
            authorRepository.saveAll(book.getMetadata().getAuthors());
        }
        bookRepository.save(book);
        bookMetadataRepository.save(book.getMetadata());
        bookViewerSettingRepository.save(book.getViewerSetting());
    }
}

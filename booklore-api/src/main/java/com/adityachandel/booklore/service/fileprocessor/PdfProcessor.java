package com.adityachandel.booklore.service.fileprocessor;

import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.enums.BookFileType;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.service.BookCreatorService;
import com.adityachandel.booklore.util.FileUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class PdfProcessor implements FileProcessor {

    private final BookRepository bookRepository;
    private final BookCreatorService bookCreatorService;
    private final BookMapper bookMapper;
    private final FileProcessingUtils fileProcessingUtils;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Override
    public Book processFile(LibraryFile libraryFile, boolean forceProcess) {
        File bookFile = new File(libraryFile.getFileName());
        String fileName = bookFile.getName();
        if (!forceProcess) {
            Optional<BookEntity> bookOptional = bookRepository.findBookByFileNameAndLibraryId(fileName, libraryFile.getLibraryEntity().getId());
            return bookOptional
                    .map(bookMapper::toBook)
                    .orElseGet(() -> processNewFile(libraryFile));
        } else {
            return processNewFile(libraryFile);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected Book processNewFile(LibraryFile libraryFile) {
        BookEntity bookEntity = bookCreatorService.createShellBook(libraryFile, BookFileType.PDF);
        try (PDDocument pdf = Loader.loadPDF(new File(FileUtils.getBookFullPath(bookEntity)))) {

            setMetadata(pdf, bookEntity);
            processCover(pdf, bookEntity);

            bookCreatorService.saveConnections(bookEntity);
            bookEntity = bookRepository.save(bookEntity);
            bookRepository.flush();
        } catch (Exception e) {
            log.error("Error while processing file {}, error: {}", libraryFile.getFileName(), e.getMessage());
        }
        return bookMapper.toBook(bookEntity);
    }

    private void processCover(PDDocument document, BookEntity bookEntity) throws IOException {
        boolean success = generateCoverImageAndSave(bookEntity.getId(), document);
        if (success) {
            fileProcessingUtils.setBookCoverPath(bookEntity.getId(), bookEntity.getMetadata());
        }
    }

    private void setMetadata(PDDocument document, BookEntity bookEntity) {
        if (document.getDocumentInformation() == null) {
            log.warn("No document information found");
        } else {
            if (document.getDocumentInformation().getTitle() != null) {
                bookEntity.getMetadata().setTitle(document.getDocumentInformation().getTitle());
            }
            if (document.getDocumentInformation().getAuthor() != null) {
                Set<String> authors = getAuthors(document);
                bookCreatorService.addAuthorsToBook(authors, bookEntity);
            }
        }
    }

    private Set<String> getAuthors(PDDocument document) {
        String authorNamesUnsplit = document.getDocumentInformation().getAuthor();
        Set<String> authorNames = new HashSet<>();
        if (authorNamesUnsplit.contains("&")) {
            authorNames.addAll(Arrays.asList(authorNamesUnsplit.split("&")));
        } else if (authorNamesUnsplit.contains(",")) {
            authorNames.addAll(Arrays.asList(authorNamesUnsplit.split(",")));
        } else {
            authorNames.add(authorNamesUnsplit);
        }
        return authorNames.stream().map(String::trim).collect(Collectors.toSet());
    }

    private boolean generateCoverImageAndSave(Long bookId, PDDocument document) throws IOException {
        BufferedImage coverImage = new PDFRenderer(document).renderImageWithDPI(0, 300, ImageType.RGB);
        return fileProcessingUtils.saveCoverImage(coverImage, bookId);
    }
}

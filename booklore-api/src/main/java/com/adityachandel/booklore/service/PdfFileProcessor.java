package com.adityachandel.booklore.service;

import com.adityachandel.booklore.config.AppProperties;
import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.dto.BookDTO;
import com.adityachandel.booklore.model.entity.Book;
import com.adityachandel.booklore.model.entity.BookMetadata;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.transformer.BookTransformer;
import com.adityachandel.booklore.util.FileService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.*;
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
public class PdfFileProcessor implements FileProcessor {

    private BookRepository bookRepository;
    private BookCreatorService bookCreatorService;
    private AppProperties appProperties;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Override
    public BookDTO processFile(LibraryFile libraryFile, boolean forceProcess) {
        File bookFile = new File(libraryFile.getFilePath());
        String fileName = bookFile.getName();
        if (!forceProcess) {
            Optional<Book> bookOptional = bookRepository.findBookByFileNameAndLibraryId(fileName, libraryFile.getLibrary().getId());
            return bookOptional.map(BookTransformer::convertToBookDTO).orElseGet(() -> processNewFile(libraryFile));
        } else {
            return processNewFile(libraryFile);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected BookDTO processNewFile(LibraryFile libraryFile) {
        File bookFile = new File(libraryFile.getFilePath());
        Book book = bookCreatorService.createShellBook(libraryFile);
        BookMetadata bookMetadata = book.getMetadata();
        try (PDDocument document = Loader.loadPDF(bookFile)) {
            if (document.getDocumentInformation() == null) {
                log.warn("No document information found");
            } else {
                if (document.getDocumentInformation().getTitle() != null) {
                    bookMetadata.setTitle(document.getDocumentInformation().getTitle());
                }
                if (document.getDocumentInformation().getAuthor() != null) {
                    Set<String> authors = getAuthors(document);
                    bookCreatorService.addAuthorsToBook(authors, book);
                }
            }
            bookCreatorService.saveConnections(book);
            Book saved = bookRepository.save(book);
            boolean success = generateCoverImage(saved.getId(), new File(appProperties.getPathConfig() + "/thumbs"), document);
            if (success) {
                bookMetadata.setThumbnail(appProperties.getPathConfig() + "/thumbs/" + book.getId() + "/f.jpg");
            }
            bookRepository.flush();
        } catch (Exception e) {
            log.error("Error while processing file {}, error: {}", libraryFile.getFilePath(), e.getMessage());
        }
        return BookTransformer.convertToBookDTO(book);
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

    private boolean generateCoverImage(Long bookId, File coverDirectory, PDDocument document) throws IOException {
        PDFRenderer renderer = new PDFRenderer(document);
        BufferedImage coverImage = renderer.renderImageWithDPI(0, 300, ImageType.RGB);
        BufferedImage resizedImage = resizeImage(coverImage, 250, 350);
        File bookDirectory = new File(coverDirectory, bookId.toString());
        if (!bookDirectory.exists()) {
            if (!bookDirectory.mkdirs()) {
                throw new IOException("Failed to create directory: " + bookDirectory.getAbsolutePath());
            }
        }
        String coverImageName = "f.jpg";
        File coverImageFile = new File(bookDirectory, coverImageName);
        return ImageIO.write(resizedImage, "JPEG", coverImageFile);
    }

    public static BufferedImage resizeImage(BufferedImage originalImage, int width, int height) {
        Image tmp = originalImage.getScaledInstance(width, height, Image.SCALE_SMOOTH);
        BufferedImage resizedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resizedImage.createGraphics();
        g2d.drawImage(tmp, 0, 0, null);
        g2d.dispose();
        return resizedImage;
    }
}

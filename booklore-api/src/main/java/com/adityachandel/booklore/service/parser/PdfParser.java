package com.adityachandel.booklore.service.parser;

import com.adityachandel.booklore.entity.Author;
import com.adityachandel.booklore.entity.Book;
import com.adityachandel.booklore.repository.AuthorRepository;
import com.adityachandel.booklore.repository.BookRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.*;

@Slf4j
@Service
@AllArgsConstructor
public class PdfParser implements BookParser {

    private AuthorRepository authorRepository;
    private BookRepository bookRepository;

    @Transactional
    @Override
    public Book parseBook(String bookPath, String coverPath) {
        File bookFile = new File(bookPath);
        log.info("Parsing: {}", bookFile.getName());
        File coverDirectory = new File(coverPath, "thumbs");
        Book book = Book.builder()
                .path(bookPath)
                .fileName(bookFile.getName())
                .authors(new ArrayList<>())
                .build();
        try (PDDocument document = Loader.loadPDF(bookFile)) {
            if (document.getDocumentInformation() == null) {
                log.warn("No document information found");
            } else {
                if (document.getDocumentInformation().getTitle() != null) {
                    book.setTitle(document.getDocumentInformation().getTitle());
                }
                if (document.getDocumentInformation().getAuthor() != null) {
                    String authorNamesUnsplit = document.getDocumentInformation().getAuthor();
                    Set<String> authorNames = new HashSet<>();
                    if (authorNamesUnsplit.contains("&")) {
                        authorNames.addAll(Arrays.asList(authorNamesUnsplit.split("&")));
                    } else if (authorNamesUnsplit.contains(",")) {
                        authorNames.addAll(Arrays.asList(authorNamesUnsplit.split(",")));
                    } else {
                        authorNames.add(authorNamesUnsplit);
                    }
                    for (String authorName : authorNames) {
                        authorName = authorName.trim();
                        Optional<Author> authorOptional = authorRepository.findByName(authorName);
                        Author author;
                        if (authorOptional.isPresent()) {
                            author = authorOptional.get();
                            book.getAuthors().add(author);
                            author.getBooks().add(book);
                        } else {
                            author = Author.builder()
                                    .name(authorName)
                                    .build();
                            author.setBooks(new ArrayList<>());
                            author.getBooks().add(book);
                            book.setAuthors(new ArrayList<>());
                            book.getAuthors().add(author);
                        }
                    }
                }
            }
            generateCoverImage(bookFile, coverDirectory, document);
        } catch (Exception e) {
            log.info("Failed to parse: {}", bookFile.getName());
            log.error(e.getMessage(), e);
        }
        return book;
    }

    private void generateCoverImage(File bookFile, File coverDirectory, PDDocument document) throws IOException {
        PDFRenderer renderer = new PDFRenderer(document);
        BufferedImage coverImage = renderer.renderImageWithDPI(0, 300, ImageType.RGB);
        BufferedImage resizedImage = resizeImage(coverImage, 250, 350);
        String coverImageName = getFileNameWithoutExtension(bookFile.getName()) + ".jpg";
        File coverImageFile = new File(coverDirectory, coverImageName);
        ImageIO.write(resizedImage, "JPEG", coverImageFile);
    }

    public static BufferedImage resizeImage(BufferedImage originalImage, int width, int height) {
        Image tmp = originalImage.getScaledInstance(width, height, Image.SCALE_SMOOTH);
        BufferedImage resizedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resizedImage.createGraphics();
        g2d.drawImage(tmp, 0, 0, null);
        g2d.dispose();
        return resizedImage;
    }

    public static String getFileNameWithoutExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex == -1) {
            return fileName;
        } else {
            return fileName.substring(0, dotIndex);
        }
    }
}

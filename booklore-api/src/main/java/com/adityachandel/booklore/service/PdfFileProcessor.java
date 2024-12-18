package com.adityachandel.booklore.service;

import com.adityachandel.booklore.config.AppProperties;
import com.adityachandel.booklore.model.enums.ParsingStatus;
import com.adityachandel.booklore.model.FileProcessResult;
import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.entity.Book;
import com.adityachandel.booklore.model.entity.BookMetadata;
import com.adityachandel.booklore.repository.*;
import com.adityachandel.booklore.transformer.BookTransformer;
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
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class PdfFileProcessor implements FileProcessor {

    private BookRepository bookRepository;
    private BookCreatorService bookCreatorService;
    private AppProperties appProperties;

    @Transactional
    @Override
    public FileProcessResult processFile(LibraryFile libraryFile, boolean forceProcess) {
        File bookFile = new File(libraryFile.getFilePath());
        String fileName = bookFile.getName();
        if (!forceProcess) {
            Optional<Book> bookOptional = bookRepository.findBookByFileNameAndLibraryId(fileName, libraryFile.getLibrary().getId());
            if (bookOptional.isPresent()) {
                return FileProcessResult.builder()
                        .libraryFile(libraryFile)
                        .bookDTO(BookTransformer.convertToBookDTO(bookOptional.get()))
                        .parsingStatus(ParsingStatus.EXISTING_BOOK_NO_FORCED_UPDATE)
                        .build();
            } else {
                return processNewFile(libraryFile);
            }
        } else {
            return processNewFile(libraryFile);
        }
    }

    private FileProcessResult processNewFile(LibraryFile libraryFile) {
        File bookFile = new File(libraryFile.getFilePath());
        Book book = bookCreatorService.createShellBook(libraryFile);
        BookMetadata bookMetadata = book.getMetadata();
        FileProcessResult fileProcessResult;
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
            generateCoverImage(bookFile, new File(appProperties.getPathConfig() + "/thumbs"), document);
        } catch (Exception e) {
            log.error("Error while processing file {}", libraryFile.getFilePath(), e);
            return FileProcessResult.builder()
                    .libraryFile(libraryFile)
                    .parsingStatus(ParsingStatus.FAILED_TO_PARSE_BOOK)
                    .build();
        }
        bookCreatorService.saveConnections(book);
        fileProcessResult = FileProcessResult.builder()
                .bookDTO(BookTransformer.convertToBookDTO(book))
                .parsingStatus(ParsingStatus.PARSED_NEW_BOOK)
                .libraryFile(libraryFile)
                .build();
        return fileProcessResult;
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

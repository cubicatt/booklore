package com.adityachandel.booklore.service;

import com.adityachandel.booklore.config.AppProperties;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.entity.AuthorEntity;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.BookMetadataEntity;
import com.adityachandel.booklore.repository.BookRepository;
import io.documentnode.epub4j.domain.Date;
import io.documentnode.epub4j.domain.Identifier;
import io.documentnode.epub4j.domain.Metadata;
import io.documentnode.epub4j.domain.Resource;
import io.documentnode.epub4j.epub.EpubReader;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class EpubFileProcessor implements FileProcessor {

    private final BookRepository bookRepository;
    private final BookCreatorService bookCreatorService;
    private final AppProperties appProperties;
    private final BookMapper bookMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Override
    public Book processFile(LibraryFile libraryFile, boolean forceProcess) {
        File bookFile = new File(libraryFile.getFilePath());
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
        File bookFile = new File(libraryFile.getFilePath());
        BookEntity bookEntity = bookCreatorService.createShellBook(libraryFile);
        bookRepository.saveAndFlush(bookEntity);
        BookMetadataEntity bookMetadataEntity = bookEntity.getMetadata();
        try {
            EpubReader epubReader = new EpubReader();
            io.documentnode.epub4j.domain.Book book = epubReader.readEpub(new FileInputStream(bookFile));
            setMetadata(book, bookMetadataEntity);

            Resource coverImage = book.getCoverImage();
            if (coverImage != null) {
                File coverDirectory = new File(appProperties.getPathConfig() + "/thumbs");
                File bookDirectory = new File(coverDirectory, bookEntity.getId().toString());
                if (!bookDirectory.exists()) {
                    if (!bookDirectory.mkdirs()) {
                        throw new IOException("Failed to create directory: " + bookDirectory.getAbsolutePath());
                    }
                }
                File coverImageFile = new File(bookDirectory, "f.jpg");
                boolean success = saveCoverImage(coverImage, coverImageFile);
                if (success) {
                    bookMetadataEntity.setThumbnail(coverImageFile.getAbsolutePath());
                }
            }

            bookCreatorService.saveConnections(bookEntity);
            bookRepository.save(bookEntity);
            bookRepository.flush();

        } catch (Exception e) {
            log.error("Error while processing file {}, error: {}", libraryFile.getFilePath(), e.getMessage());
        }
        return bookMapper.toBook(bookEntity);
    }

    private void setMetadata(io.documentnode.epub4j.domain.Book book, BookMetadataEntity metadataEntity) {
        Metadata metadata = book.getMetadata();

        if (metadata != null) {
            metadataEntity.setTitle(metadata.getFirstTitle());

            if (metadata.getAuthors() != null && !metadata.getAuthors().isEmpty()) {
                List<AuthorEntity> authorEntities = metadata.getAuthors().stream()
                        .map(author -> author.getFirstname() + " " + author.getLastname())
                        .map(a -> AuthorEntity.builder().name(a).build())
                        .collect(Collectors.toList());
                metadataEntity.setAuthors(authorEntities);
            }

            if (metadata.getDescriptions() != null && !metadata.getDescriptions().isEmpty()) {
                metadataEntity.setDescription(metadata.getDescriptions().getFirst());
            }

            if (metadata.getPublishers() != null && !metadata.getPublishers().isEmpty()) {
                metadataEntity.setPublisher(metadata.getPublishers().getFirst());
            }

            List<String> identifiers = metadata.getIdentifiers().stream()
                    .map(Identifier::getValue)
                    .toList();
            if (!identifiers.isEmpty()) {
                String isbn13 = identifiers.stream().filter(id -> id.length() == 13).findFirst().orElse(null);
                String isbn10 = identifiers.stream().filter(id -> id.length() == 10).findFirst().orElse(null);
                metadataEntity.setIsbn13(isbn13);
                metadataEntity.setIsbn10(isbn10);
            }

            metadataEntity.setLanguage(metadata.getLanguage() == null || metadata.getLanguage().equalsIgnoreCase("UND") ? "en" : metadata.getLanguage());

            if (metadata.getDates() != null && !metadata.getDates().isEmpty()) {
                metadata.getDates().stream()
                .findFirst()
                .ifPresent(publishedDate -> {
                    String dateString = publishedDate.getValue();
                    if (isValidLocalDate(dateString)) {
                        LocalDate parsedDate = LocalDate.parse(dateString);
                        metadataEntity.setPublishedDate(parsedDate);
                    } else if (isValidOffsetDateTime(dateString)) {
                        OffsetDateTime offsetDateTime = OffsetDateTime.parse(dateString);
                        metadataEntity.setPublishedDate(offsetDateTime.toLocalDate());
                    } else {
                        log.error("Unable to parse date: {}", dateString);
                    }
                });
            }
        }
    }

    private boolean saveCoverImage(Resource coverImage, File coverImageFile) {
        if (coverImage == null) {
            return false;
        }
        try {
            BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(coverImage.getData()));
            BufferedImage resizedImage = resizeImage(originalImage, 250, 350);
            return ImageIO.write(resizedImage, "JPEG", coverImageFile);
        } catch (IOException e) {
            log.error("Failed to save cover image: {}", e.getMessage());
            return false;
        }
    }

    private BufferedImage resizeImage(BufferedImage originalImage, int width, int height) {
        Image tmp = originalImage.getScaledInstance(width, height, Image.SCALE_SMOOTH);
        BufferedImage resizedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resizedImage.createGraphics();
        g2d.drawImage(tmp, 0, 0, null);
        g2d.dispose();
        return resizedImage;
    }

    private boolean isValidLocalDate(String dateString) {
        try {
            LocalDate.parse(dateString);
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
    }

    private boolean isValidOffsetDateTime(String dateString) {
        try {
            OffsetDateTime.parse(dateString);
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
    }

}
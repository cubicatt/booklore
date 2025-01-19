package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.entity.LibraryEntity;
import com.adityachandel.booklore.model.entity.LibraryPathEntity;
import com.adityachandel.booklore.model.enums.BookFileType;
import com.adityachandel.booklore.model.websocket.Topic;
import com.adityachandel.booklore.repository.LibraryRepository;
import com.adityachandel.booklore.service.fileprocessor.EpubProcessor;
import com.adityachandel.booklore.service.fileprocessor.PdfProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;

@RequiredArgsConstructor
@Service
@Slf4j
public class FileUploadService {


    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
    private static final String PDF_MIME_TYPE = "application/pdf";
    private static final String EPUB_MIME_TYPE = "application/epub+zip";

    private final LibraryRepository libraryRepository;
    private final PdfProcessor pdfProcessor;
    private final EpubProcessor epubProcessor;
    private final NotificationService notificationService;

    public Book uploadFile(MultipartFile file, long libraryId, long pathId) {
        validateFile(file);

        LibraryEntity libraryEntity = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));

        LibraryPathEntity libraryPath = libraryEntity.getLibraryPaths()
                .stream()
                .filter(p -> p.getId() == pathId)
                .findFirst()
                .orElseThrow(() -> ApiError.INVALID_LIBRARY_PATH.createException(libraryId));

        Path storagePath = Paths.get(libraryPath.getPath(), Objects.requireNonNull(file.getOriginalFilename()));
        File storageFile = storagePath.toFile();

        if (storageFile.exists()) {
            throw ApiError.FILE_ALREADY_EXISTS.createException();
        }

        try {
            file.transferTo(storageFile);
            log.info("File uploaded successfully: {}", storageFile.getAbsolutePath());
            Book book = processFile(file, libraryEntity, storageFile);
            notificationService.sendMessage(Topic.BOOK_ADD, book);
            log.info("Book processed successfully: {}", book.getMetadata().getTitle());
            return book;
        } catch (IOException e) {
            log.error("Error saving file: {}", e.getMessage());
            throw ApiError.FILE_READ_ERROR.createException(e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        String fileType = file.getContentType();
        if ((!PDF_MIME_TYPE.equals(fileType) && !EPUB_MIME_TYPE.equals(fileType))) {
            throw ApiError.INVALID_FILE_FORMAT.createException();
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw ApiError.FILE_TOO_LARGE.createException();
        }
    }

    private Book processFile(MultipartFile file, LibraryEntity libraryEntity, File storageFile) {
        BookFileType fileType = determineFileType(file.getContentType());
        if (fileType == null) {
            throw ApiError.INVALID_FILE_FORMAT.createException();
        }

        LibraryFile libraryFile = LibraryFile.builder()
                .libraryEntity(libraryEntity)
                .bookFileType(fileType)
                .fileName(storageFile.getAbsolutePath())
                .build();

        switch (fileType) {
            case PDF -> {
                return pdfProcessor.processFile(libraryFile, false);
            }
            case EPUB -> {
                return epubProcessor.processFile(libraryFile, false);
            }
            default -> {
                log.warn("Unsupported file type for processing: {}", fileType);
                throw ApiError.INVALID_FILE_FORMAT.createException();
            }
        }
    }

    private BookFileType determineFileType(String fileType) {
        return switch (fileType.toLowerCase()) {
            case PDF_MIME_TYPE -> BookFileType.PDF;
            case EPUB_MIME_TYPE -> BookFileType.EPUB;
            default -> null;
        };
    }
}
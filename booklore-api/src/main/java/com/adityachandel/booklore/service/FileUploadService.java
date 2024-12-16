package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.entity.Library;
import com.adityachandel.booklore.repository.LibraryRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@AllArgsConstructor
@Service
@Slf4j
public class FileUploadService {

    private final LibraryRepository libraryRepository;
    private final PdfFileProcessor fileProcessor;

    public void uploadFile(MultipartFile file, long libraryId, String filePath) {
        Library library = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        if (!library.getPaths().contains(filePath)) {
            throw ApiError.INVALID_LIBRARY_PATH.createException();
        }
        String fileType = file.getContentType();
        if (!"application/pdf".equals(fileType) && !"application/epub+zip".equals(fileType)) {
            throw ApiError.INVALID_FILE_FORMAT.createException();
        }
        if (file.getSize() > 100 * 1024 * 1024) {
            throw ApiError.FILE_TOO_LARGE.createException();
        }
        try {
            Path storagePath = Paths.get(filePath, file.getOriginalFilename());
            File storageFile = storagePath.toFile();
            if (storageFile.exists()) {
                throw ApiError.FILE_ALREADY_EXISTS.createException();
            }
            file.transferTo(storageFile);
            LibraryFile libraryFile = LibraryFile.builder()
                    .library(library)
                    .fileType(getFileType(fileType))
                    .filePath(storageFile.getAbsolutePath())
                    .build();
            fileProcessor.processFile(libraryFile, false);
            log.info("File uploaded successfully: {}", storageFile.getAbsolutePath());

        } catch (IOException e) {
            throw ApiError.FILE_READ_ERROR.createException(e.getMessage());
        }
    }

    private String getFileType(String f) {
        if (f.equalsIgnoreCase("application/pdf")) {
            return "pdf";
        } else if (f.equalsIgnoreCase("application/epub+zip")) {
            return "epub";
        } else {
            return null;
        }
    }
}

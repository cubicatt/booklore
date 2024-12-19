package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.dto.BookDTO;
import com.adityachandel.booklore.model.entity.Library;
import com.adityachandel.booklore.repository.LibraryRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class LibraryProcessingService {

    private final LibraryRepository libraryRepository;
    private final NotificationService notificationService;
    private final PdfFileProcessor pdfFileProcessor;


    @Transactional
    public void parseLibraryBooks(long libraryId) throws IOException {
        Library library = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        List<LibraryFile> libraryFiles = getLibraryFiles(library);
        for (LibraryFile libraryFile : libraryFiles) {
            log.info("Processing file: {}", libraryFile.getFilePath());
            BookDTO bookDTO = processLibraryFile(libraryFile);
            if(bookDTO != null) {
                notificationService.sendMessage("/topic/books", bookDTO);
            }
        }
    }

    @Transactional
    protected BookDTO processLibraryFile(LibraryFile libraryFile) {
        if (libraryFile.getFileType().equalsIgnoreCase("pdf")) {
            return pdfFileProcessor.processFile(libraryFile, false);
        }
        return null;
    }

    private List<LibraryFile> getLibraryFiles(Library library) throws IOException {
        List<LibraryFile> libraryFiles = new ArrayList<>();
        for (String libraryPath : library.getPaths()) {
            libraryFiles.addAll(findLibraryFiles(libraryPath, library));
        }
        return libraryFiles;
    }

    private List<LibraryFile> findLibraryFiles(String directoryPath, Library library) throws IOException {
        List<LibraryFile> libraryFiles = new ArrayList<>();
        try (var stream = Files.walk(Path.of(directoryPath))) {
            stream.filter(Files::isRegularFile)
                    .filter(file -> {
                        String fileName = file.getFileName().toString().toLowerCase();
                        return fileName.endsWith(".pdf") || fileName.endsWith(".epub");
                    })
                    .forEach(file -> {
                        String fileType = file.getFileName().toString().toLowerCase().endsWith(".pdf") ? "PDF" : "EPUB";
                        libraryFiles.add(new LibraryFile(library, file.toAbsolutePath().toString(), fileType));
                    });
        }
        return libraryFiles;
    }


}


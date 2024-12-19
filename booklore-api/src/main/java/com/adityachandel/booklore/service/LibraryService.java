package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.FileProcessResult;
import com.adityachandel.booklore.model.LibraryFile;
import com.adityachandel.booklore.model.ParseLibraryEvent;
import com.adityachandel.booklore.model.enums.ParsingStatus;
import com.adityachandel.booklore.model.dto.*;
import com.adityachandel.booklore.model.dto.request.CreateLibraryRequest;
import com.adityachandel.booklore.model.entity.Book;
import com.adityachandel.booklore.model.entity.Library;
import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.repository.*;
import com.adityachandel.booklore.transformer.BookTransformer;
import com.adityachandel.booklore.transformer.LibraryTransformer;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Service
@AllArgsConstructor
public class LibraryService {

    private LibraryRepository libraryRepository;
    private BookRepository bookRepository;
    private PdfFileProcessor pdfFileProcessor;
    private final Map<Long, ReentrantLock> libraryLocks = new ConcurrentHashMap<>();


    public LibraryDTO createLibrary(CreateLibraryRequest request) {
        Library library = Library.builder()
                .name(request.getName())
                .paths(request.getPaths())
                .build();
        return LibraryTransformer.convertToLibraryDTO(libraryRepository.save(library));
    }

    public LibraryDTO getLibrary(long libraryId) {
        Library library = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        return LibraryTransformer.convertToLibraryDTO(library);
    }

    public Page<LibraryDTO> getLibraries(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Library> libraryPage = libraryRepository.findAll(pageRequest);
        return libraryPage.map(LibraryTransformer::convertToLibraryDTO);
    }

    public void deleteLibrary(long id) {
        libraryRepository.findById(id).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(id));
        libraryRepository.deleteById(id);
    }

    public BookDTO getBook(long libraryId, long bookId) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        Book book = bookRepository.findBookByIdAndLibraryId(bookId, libraryId).orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        return BookTransformer.convertToBookDTO(book);
    }

    public Page<BookDTO> getBooks(long libraryId, int page, int size) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Book> bookPage = bookRepository.findBooksByLibraryId(libraryId, pageRequest);
        return bookPage.map(BookTransformer::convertToBookDTO);
    }


    public SseEmitter parseLibraryBooks(long libraryId, boolean force) {
        ReentrantLock lock = libraryLocks.computeIfAbsent(libraryId, k -> new ReentrantLock());
        if (!lock.tryLock()) {
            SseEmitter emitter = new SseEmitter();
            emitter.completeWithError(new IllegalStateException("Library is already being processed"));
            return emitter;
        }
        Library library = libraryRepository.findById(libraryId).orElseThrow(() -> ApiError.LIBRARY_NOT_FOUND.createException(libraryId));
        if(library.isInitialProcessed()) {
            SseEmitter emitter = new SseEmitter();
            emitter.complete();
            return emitter;
        }
        SseEmitter emitter = new SseEmitter();
        ExecutorService sseMvcExecutor = Executors.newSingleThreadExecutor();
        final AtomicBoolean isCompleted = new AtomicBoolean(false);
        emitter.onTimeout(() -> {
            log.info("Emitter timeout reached. Stopping further processing.");
            emitter.complete();
            isCompleted.set(true);
        });
        emitter.onCompletion(() -> {
            log.info("Emitter completed. Shutting down executor.");
            isCompleted.set(true);
            sseMvcExecutor.shutdown();
        });
        sseMvcExecutor.execute(() -> {
            try {
                List<LibraryFile> libraryFiles = getLibraryFiles(library);
                for (LibraryFile libraryFile : libraryFiles) {
                    try {
                        log.info("Processing file: {}", libraryFile.getFilePath());
                        FileProcessResult fileProcessResult = processLibraryFile(libraryFile);
                        ParseLibraryEvent event = createParseLibraryEvent(libraryId, fileProcessResult);
                        if (!isCompleted.get()) {
                            emitter.send(event);
                        }
                        Thread.sleep(500);
                    } catch (AsyncRequestNotUsableException | IllegalStateException e) {
                        log.warn("Client disconnected! Continue processing.");
                    } catch (IOException e) {
                        log.warn("Client disconnected or failed to send response: {}", libraryFile.getFilePath(), e);
                        emitter.completeWithError(e);
                        sseMvcExecutor.shutdown();
                        return;
                    } catch (Exception e) {
                        log.error("Error processing file: {}", libraryFile.getFilePath(), e);
                        emitter.completeWithError(e);
                        sseMvcExecutor.shutdown();
                        return;
                    }
                }
                library.setInitialProcessed(true);
                libraryRepository.save(library);
                emitter.complete();
                sseMvcExecutor.shutdown();
            } catch (Exception ex) {
                log.error("Error during file processing: ", ex);
                if (!isCompleted.get()) {
                    emitter.completeWithError(ex);
                    sseMvcExecutor.shutdown();
                }
            } finally {
                log.info("File processing complete. Executor shutting down.");
                lock.unlock();
                emitter.complete();
                sseMvcExecutor.shutdown();
            }
        });
        return emitter;
    }

    private ParseLibraryEvent createParseLibraryEvent(long libraryId, FileProcessResult result) {
        return ParseLibraryEvent.builder()
                .libraryId(libraryId)
                .file(result.getLibraryFile().getFilePath())
                .parsingStatus(result.getParsingStatus())
                .book(result.getBookDTO())
                .build();
    }

    private FileProcessResult processLibraryFile(LibraryFile libraryFile) {
        if (libraryFile.getFileType().equalsIgnoreCase("pdf")) {
            return pdfFileProcessor.processFile(libraryFile, false);
        } else if (libraryFile.getFileType().equalsIgnoreCase("epub")) {
            // TODO:: To implement
            return FileProcessResult.builder().parsingStatus(ParsingStatus.FAILED_TO_PARSE_BOOK).libraryFile(libraryFile).build();
        }
        // TODO:: To handle
        return FileProcessResult.builder().parsingStatus(ParsingStatus.FAILED_TO_PARSE_BOOK).libraryFile(libraryFile).build();
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

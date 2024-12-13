package com.adityachandel.booklore.service;

import com.adityachandel.booklore.config.AppProperties;
import com.adityachandel.booklore.dto.BookDTO;
import com.adityachandel.booklore.dto.BookViewerSettingDTO;
import com.adityachandel.booklore.entity.Book;
import com.adityachandel.booklore.entity.BookViewerSetting;
import com.adityachandel.booklore.entity.Library;
import com.adityachandel.booklore.exception.ErrorCode;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.BookViewerSettingRepository;
import com.adityachandel.booklore.service.parser.PdfParser;
import com.adityachandel.booklore.transformer.BookSettingTransformer;
import com.adityachandel.booklore.transformer.BookTransformer;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@AllArgsConstructor
@Service
public class BooksService {

    private final AppProperties appProperties;
    private final PdfParser pdfParser;
    private final BookRepository bookRepository;
    private final BookViewerSettingRepository bookViewerSettingRepository;


    public BookDTO getBook(long bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ErrorCode.BOOK_NOT_FOUND.createException(bookId));
        return BookTransformer.convertToBookDTO(book);
    }

    public Page<BookDTO> getBooks(int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        PageRequest pageRequest = PageRequest.of(page, size, sort);
        Page<Book> bookPage = Page.empty();
        if (sortBy.equals("addedOn")) {
            bookPage = bookRepository.findByAddedOnIsNotNull(pageRequest);
        } else if (sortBy.equals("lastReadTime")) {
            bookPage = bookRepository.findByLastReadTimeIsNotNull(pageRequest);
        }
        List<BookDTO> bookDTOs = bookPage.getContent().stream()
                .map(BookTransformer::convertToBookDTO)
                .collect(Collectors.toList());
        return new PageImpl<>(bookDTOs, pageRequest, bookPage.getTotalElements());
    }

    public List<Book> parseBooks(Library library, SseEmitter emitter) {
        List<Book> books = new ArrayList<>();
        for (String libraryPath : library.getPaths()) {
            books.addAll(parseBooks(libraryPath, emitter));
        }
        return books;
    }

    private List<Book> parseBooks(String libraryPath, SseEmitter emitter) {
        List<Book> books = new ArrayList<>();
        try (Stream<Path> filePaths = Files.walk(Path.of(libraryPath))) {
            filePaths.filter(Files::isRegularFile).forEach(filePath -> handleFile(filePath, books, emitter));
        } catch (IOException e) {
            log.error("Error reading files from path: {}", libraryPath, e);
            throw ErrorCode.FILE_READ_ERROR.createException(libraryPath);
        }
        return books;
    }

    private void handleFile(Path filePath, List<Book> books, SseEmitter emitter) {
        String fileName = filePath.getFileName().toString();
        if (fileName.endsWith(".pdf")) {
            sendSseEvent("Parsing: " + fileName, emitter);
            Book book = parsePdfBook(filePath);
            book.setPath(filePath.toAbsolutePath().toString());
            books.add(book);
        } else if (fileName.endsWith(".epub")) {
            log.info("EPUB File: {}", fileName);
        }
    }

    private void sendSseEvent(String message, SseEmitter emitter) {
        try {
            SseEmitter.SseEventBuilder event = SseEmitter.event()
                    .data(message)
                    .name("SSE Event");
            emitter.send(event);
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
    }

    private Book parsePdfBook(Path filePath) {
        Book book = pdfParser.parseBook(filePath.toAbsolutePath().toString(), appProperties.getPathConfig());
        book.setViewerSetting(BookViewerSetting.builder()
                .bookId(book.getId())
                .build());
        return book;
    }

    public void saveBookViewerSetting(long bookId, BookViewerSettingDTO bookViewerSettingDTO) {
        BookViewerSetting bookViewerSetting = bookViewerSettingRepository.findById(bookId).orElseThrow(() -> ErrorCode.BOOK_NOT_FOUND.createException(bookId));
        bookViewerSetting.setPageNumber(bookViewerSettingDTO.getPageNumber());
        bookViewerSetting.setZoom(bookViewerSettingDTO.getZoom());
        bookViewerSetting.setSpread(bookViewerSettingDTO.getSpread());
        bookViewerSetting.setSidebar_visible(bookViewerSettingDTO.isSidebar_visible());
        bookViewerSettingRepository.save(bookViewerSetting);
    }

    public Resource getBookCover(long bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ErrorCode.BOOK_NOT_FOUND.createException(bookId));
        String thumbPath = appProperties.getPathConfig() + "/thumbs/" + PdfParser.getFileNameWithoutExtension(book.getFileName()) + ".jpg";
        Path filePath = Paths.get(thumbPath);
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw ErrorCode.IMAGE_NOT_FOUND.createException(thumbPath);
            }
        } catch (IOException e) {
            throw ErrorCode.IMAGE_NOT_FOUND.createException(thumbPath);
        }
    }

    public ResponseEntity<byte[]> getBookData(long bookId) throws IOException {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ErrorCode.BOOK_NOT_FOUND.createException(bookId));
        byte[] pdfBytes = Files.readAllBytes(new File(book.getPath()).toPath());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(pdfBytes);
    }

    public List<BookDTO> search(String title) {
        List<Book> books = bookRepository.findByTitleContainingIgnoreCase(title);
        return books.stream().map(BookTransformer::convertToBookDTO).toList();
    }

    public BookViewerSettingDTO getBookViewerSetting(long bookId) {
        BookViewerSetting bookViewerSetting = bookViewerSettingRepository.findById(bookId).orElseThrow(() -> ErrorCode.BOOK_NOT_FOUND.createException(bookId));
        return BookSettingTransformer.convertToDTO(bookViewerSetting);
    }

    public void updateLastReadTime(long bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> ErrorCode.BOOK_NOT_FOUND.createException(bookId));
        book.setLastReadTime(Instant.now());
        bookRepository.save(book);
    }
}

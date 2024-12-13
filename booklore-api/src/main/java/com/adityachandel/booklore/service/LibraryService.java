package com.adityachandel.booklore.service;

import com.adityachandel.booklore.dto.BookDTO;
import com.adityachandel.booklore.dto.LibraryDTO;
import com.adityachandel.booklore.dto.request.CreateLibraryRequest;
import com.adityachandel.booklore.entity.Author;
import com.adityachandel.booklore.entity.Book;
import com.adityachandel.booklore.entity.Library;
import com.adityachandel.booklore.exception.ErrorCode;
import com.adityachandel.booklore.repository.AuthorRepository;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.BookViewerSettingRepository;
import com.adityachandel.booklore.repository.LibraryRepository;
import com.adityachandel.booklore.transformer.BookTransformer;
import com.adityachandel.booklore.transformer.LibraryTransformer;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

import static com.adityachandel.booklore.transformer.LibraryTransformer.createLibraryFromRequest;

@Service
@AllArgsConstructor
public class LibraryService {

    private LibraryRepository libraryRepository;
    private BookRepository bookRepository;
    private BooksService booksService;
    private AuthorRepository authorRepository;
    private BookViewerSettingRepository bookViewerSettingRepository;


    public LibraryDTO getLibrary(long libraryId) {
        Library library = libraryRepository.findById(libraryId).orElseThrow(() -> ErrorCode.LIBRARY_NOT_FOUND.createException(libraryId));
        return LibraryTransformer.convertToLibraryDTO(library);
    }

    public Page<LibraryDTO> getLibraries(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Library> libraryPage = libraryRepository.findAll(pageRequest);
        return libraryPage.map(LibraryTransformer::convertToLibraryDTO);
    }

    public void deleteLibrary(long id) {
        libraryRepository.findById(id).orElseThrow(() -> ErrorCode.LIBRARY_NOT_FOUND.createException(id));
        libraryRepository.deleteById(id);
    }


    public BookDTO getBook(long libraryId, long bookId) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ErrorCode.LIBRARY_NOT_FOUND.createException(libraryId));
        Book book = bookRepository.findBookByIdAndLibraryId(bookId, libraryId).orElseThrow(() -> ErrorCode.BOOK_NOT_FOUND.createException(bookId));
        return BookTransformer.convertToBookDTO(book);
    }

    public Page<BookDTO> getBooks(long libraryId, int page, int size) {
        libraryRepository.findById(libraryId).orElseThrow(() -> ErrorCode.LIBRARY_NOT_FOUND.createException(libraryId));
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Book> bookPage = bookRepository.findBooksByLibraryId(libraryId, pageRequest);
        return bookPage.map(BookTransformer::convertToBookDTO);
    }


    public SseEmitter createLibrary(CreateLibraryRequest request) {
        SseEmitter emitter = new SseEmitter();
        ExecutorService sseMvcExecutor = Executors.newSingleThreadExecutor();

        sseMvcExecutor.execute(() -> {
            try {
                Library library = createLibraryFromRequest(request);
                List<Book> books = booksService.parseBooks(library, emitter);
                books.forEach(book -> book.setLibrary(library));
                library.setBooks(books);

                List<Author> authors = books.stream()
                        .flatMap(book -> book.getAuthors().stream())
                        .distinct()
                        .collect(Collectors.toList());
                authorRepository.saveAll(authors);

                libraryRepository.save(library);
                bookRepository.saveAll(books);
                bookViewerSettingRepository.saveAll(books.stream()
                        .map(Book::getViewerSetting)
                        .collect(Collectors.toList()));

                emitter.complete();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            } finally {
                sseMvcExecutor.shutdown();
            }
        });

        return emitter;
    }

}

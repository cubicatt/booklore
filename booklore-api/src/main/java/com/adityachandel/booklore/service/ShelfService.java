package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.dto.ShelfDTO;
import com.adityachandel.booklore.model.dto.request.ShelfCreateRequest;
import com.adityachandel.booklore.model.entity.Book;
import com.adityachandel.booklore.model.entity.Shelf;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.ShelfRepository;
import com.adityachandel.booklore.transformer.ShelfTransformer;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class ShelfService {

    private final ShelfRepository shelfRepository;
    private  final BookRepository bookRepository;

    public ShelfDTO createShelf(ShelfCreateRequest request) {
        boolean exists = shelfRepository.existsByName(request.getName());
        if (exists) {
            throw ApiError.SHELF_ALREADY_EXISTS.createException(request.getName());
        }
        Shelf shelf = Shelf.builder().name(request.getName()).build();
        return ShelfTransformer.convertToShelfDTO(shelfRepository.save(shelf));
    }

    public ShelfDTO updateShelf(Long id, ShelfCreateRequest request) {
        Shelf shelf = shelfRepository.findById(id)
                .orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(id));
        shelf.setName(request.getName());
        return ShelfTransformer.convertToShelfDTO(shelfRepository.save(shelf));
    }

    public ShelfDTO addBookToShelf(Long shelfId, Long bookId) {
        Shelf shelf = shelfRepository.findById(shelfId)
                .orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(shelfId));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> ApiError.BOOK_NOT_FOUND.createException(bookId));
        shelf.getBooks().add(book);
        shelfRepository.save(shelf);
        return ShelfTransformer.convertToShelfDTO(shelf);
    }

    public List<ShelfDTO> getShelves() {
        return shelfRepository.findAll().stream().map(ShelfTransformer::convertToShelfDTO).toList();
    }

    public ShelfDTO getShelf(Long shelfId) {
        Shelf shelf = shelfRepository.findById(shelfId).orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(shelfId));
        return ShelfTransformer.convertToShelfDTO(shelf);
    }

    public void deleteShelf(Long shelfId) {
        shelfRepository.findById(shelfId).orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(shelfId));
        shelfRepository.deleteById(shelfId);
    }
}

package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.dto.BookDTO;
import com.adityachandel.booklore.model.dto.ShelfDTO;
import com.adityachandel.booklore.model.dto.request.ShelfCreateRequest;
import com.adityachandel.booklore.model.entity.Book;
import com.adityachandel.booklore.model.entity.Shelf;
import com.adityachandel.booklore.model.entity.Sort;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.ShelfRepository;
import com.adityachandel.booklore.transformer.BookTransformer;
import com.adityachandel.booklore.transformer.ShelfTransformer;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class ShelfService {

    private final ShelfRepository shelfRepository;
    private final BookRepository bookRepository;

    public ShelfDTO createShelf(ShelfCreateRequest request) {
        boolean exists = shelfRepository.existsByName(request.getName());
        if (exists) {
            throw ApiError.SHELF_ALREADY_EXISTS.createException(request.getName());
        }
        Shelf shelf = Shelf.builder().icon(request.getIcon()).name(request.getName()).build();
        return ShelfTransformer.convertToShelfDTO(shelfRepository.save(shelf));
    }

    public ShelfDTO updateShelf(Long id, ShelfCreateRequest request) {
        Shelf shelf = shelfRepository.findById(id)
                .orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(id));
        shelf.setName(request.getName());
        return ShelfTransformer.convertToShelfDTO(shelfRepository.save(shelf));
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

    public List<BookDTO> getShelfBooks(Long shelfId) {
        shelfRepository.findById(shelfId).orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(shelfId));
        List<Book> books = bookRepository.findByShelfId(shelfId);
        return books.stream().map(BookTransformer::convertToBookDTO).toList();
    }

    public ShelfDTO updateSort(long shelfId, Sort sort) {
        Shelf shelf = shelfRepository.findById(shelfId).orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(shelfId));
        shelf.setSort(sort);
        return ShelfTransformer.convertToShelfDTO(shelfRepository.save(shelf));
    }
}

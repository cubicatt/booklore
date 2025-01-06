package com.adityachandel.booklore.service;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.mapper.ShelfMapper;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.Shelf;
import com.adityachandel.booklore.model.dto.request.ShelfCreateRequest;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.ShelfEntity;
import com.adityachandel.booklore.model.dto.Sort;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.ShelfRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class ShelfService {

    private final ShelfRepository shelfRepository;
    private final BookRepository bookRepository;
    private final ShelfMapper shelfMapper;
    private final BookMapper bookMapper;

    public Shelf createShelf(ShelfCreateRequest request) {
        boolean exists = shelfRepository.existsByName(request.getName());
        if (exists) {
            throw ApiError.SHELF_ALREADY_EXISTS.createException(request.getName());
        }
        ShelfEntity shelfEntity = ShelfEntity.builder().icon(request.getIcon()).name(request.getName()).build();
        return shelfMapper.toShelf((shelfRepository.save(shelfEntity)));
    }

    public Shelf updateShelf(Long id, ShelfCreateRequest request) {
        ShelfEntity shelfEntity = shelfRepository.findById(id)
                .orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(id));
        shelfEntity.setName(request.getName());
        return shelfMapper.toShelf(shelfRepository.save(shelfEntity));
    }

    public List<Shelf> getShelves() {
        return shelfRepository.findAll().stream()
                .map(shelfMapper::toShelf)
                .toList();
    }

    public Shelf getShelf(Long shelfId) {
        ShelfEntity shelfEntity = shelfRepository.findById(shelfId).orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(shelfId));
        return shelfMapper.toShelf(shelfEntity);
    }

    public void deleteShelf(Long shelfId) {
        shelfRepository.findById(shelfId).orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(shelfId));
        shelfRepository.deleteById(shelfId);
    }

    public List<Book> getShelfBooks(Long shelfId) {
        shelfRepository.findById(shelfId).orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(shelfId));
        List<BookEntity> bookEntities = bookRepository.findByShelfId(shelfId);
        return bookEntities.stream()
                .map(bookMapper::toBook)
                .toList();
    }

    public Shelf updateSort(long shelfId, Sort sort) {
        ShelfEntity shelfEntity = shelfRepository.findById(shelfId).orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(shelfId));
        shelfEntity.setSort(sort);
        return shelfMapper.toShelf(shelfRepository.save(shelfEntity));
    }
}

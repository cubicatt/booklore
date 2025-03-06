package com.adityachandel.booklore.service;

import com.adityachandel.booklore.config.security.AuthenticationService;
import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.mapper.ShelfMapper;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.BookLoreUser;
import com.adityachandel.booklore.model.dto.Shelf;
import com.adityachandel.booklore.model.dto.request.ShelfCreateRequest;
import com.adityachandel.booklore.model.entity.BookEntity;
import com.adityachandel.booklore.model.entity.BookLoreUserEntity;
import com.adityachandel.booklore.model.entity.ShelfEntity;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.ShelfRepository;
import com.adityachandel.booklore.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class ShelfService {

    private final ShelfRepository shelfRepository;
    private final BookRepository bookRepository;
    private final ShelfMapper shelfMapper;
    private final BookMapper bookMapper;
    private final AuthenticationService authenticationService;
    private final UserRepository userRepository;

    public Shelf createShelf(ShelfCreateRequest request) {
        BookLoreUser user = authenticationService.getAuthenticatedUser();
        BookLoreUserEntity userEntity = userRepository.findById(user.getId()).orElseThrow(() -> new UsernameNotFoundException("User not found"));
        boolean exists = shelfRepository.existsByUserIdAndName(user.getId(), request.getName());
        if (exists) {
            throw ApiError.SHELF_ALREADY_EXISTS.createException(request.getName());
        }
        ShelfEntity shelfEntity = ShelfEntity.builder()
                .icon(request.getIcon())
                .name(request.getName())
                .user(userEntity)
                .build();
        return shelfMapper.toShelf(shelfRepository.save(shelfEntity));
    }

    public Shelf updateShelf(Long id, ShelfCreateRequest request) {
        ShelfEntity shelfEntity = shelfRepository.findById(id).orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(id));
        shelfEntity.setName(request.getName());
        shelfEntity.setIcon(request.getIcon());
        return shelfMapper.toShelf(shelfRepository.save(shelfEntity));
    }

    public List<Shelf> getShelves() {
        BookLoreUser user = authenticationService.getAuthenticatedUser();
        return shelfRepository.findByUserId(user.getId()).stream()
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
}

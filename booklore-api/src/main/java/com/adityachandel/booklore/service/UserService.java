package com.adityachandel.booklore.service;

import com.adityachandel.booklore.config.security.JwtUtils;
import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookLoreUserMapper;
import com.adityachandel.booklore.model.BookPreferences;
import com.adityachandel.booklore.model.dto.BookLoreUser;
import com.adityachandel.booklore.model.dto.UserCreateRequest;
import com.adityachandel.booklore.model.dto.request.UserLoginRequest;
import com.adityachandel.booklore.model.dto.request.UserUpdateRequest;
import com.adityachandel.booklore.model.entity.BookLoreUserEntity;
import com.adityachandel.booklore.model.entity.LibraryEntity;
import com.adityachandel.booklore.model.entity.UserPermissionsEntity;
import com.adityachandel.booklore.repository.LibraryRepository;
import com.adityachandel.booklore.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BookLoreUserMapper bookLoreUserMapper;
    private final PasswordEncoder passwordEncoder;
    private final LibraryRepository libraryRepository;
    private final JwtUtils jwtUtils;

    @Transactional
    public void registerUser(UserCreateRequest request) {
        Optional<BookLoreUserEntity> existingUser = userRepository.findByUsername(request.getUsername());
        if (existingUser.isPresent()) {
            throw ApiError.USERNAME_ALREADY_TAKEN.createException(request.getUsername());
        }

        BookLoreUserEntity bookLoreUserEntity = new BookLoreUserEntity();
        bookLoreUserEntity.setUsername(request.getUsername());
        bookLoreUserEntity.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        bookLoreUserEntity.setName(request.getName());
        bookLoreUserEntity.setEmail(request.getEmail());

        UserPermissionsEntity permissions = new UserPermissionsEntity();
        permissions.setUser(bookLoreUserEntity);
        permissions.setPermissionUpload(request.isPermissionUpload());
        permissions.setPermissionDownload(request.isPermissionDownload());
        permissions.setPermissionEditMetadata(request.isPermissionEditMetadata());
        permissions.setPermissionManipulateLibrary(request.isPermissionManipulateLibrary());
        bookLoreUserEntity.setPermissions(permissions);

        bookLoreUserEntity.setBookPreferences(buildDefaultBookPreferences());

        if (request.getSelectedLibraries() != null && !request.getSelectedLibraries().isEmpty()) {
            List<LibraryEntity> libraries = libraryRepository.findAllById(request.getSelectedLibraries());
            bookLoreUserEntity.setLibraries(new ArrayList<>(libraries));
        }

        userRepository.save(bookLoreUserEntity);
    }

    public ResponseEntity<Map<String, String>> loginUser(UserLoginRequest loginRequest) {
        BookLoreUserEntity user = userRepository.findByUsername(loginRequest.getUsername()).orElseThrow(() -> ApiError.USER_NOT_FOUND.createException(loginRequest.getUsername()));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw ApiError.INVALID_CREDENTIALS.createException();
        }

        String token = jwtUtils.generateToken(user);
        return ResponseEntity.ok(Map.of("token", token));
    }

    public List<BookLoreUser> getBookLoreUsers() {
        return userRepository.findAll()
                .stream()
                .map(bookLoreUserMapper::toDto)
                .collect(Collectors.toList());
    }

    public BookLoreUser updateUser(Long id, UserUpdateRequest updateRequest) {
        BookLoreUserEntity user = userRepository.findById(id).orElseThrow(() -> ApiError.USER_NOT_FOUND.createException(id));

        user.setName(updateRequest.getName());
        user.setEmail(updateRequest.getEmail());
        user.getPermissions().setPermissionUpload(updateRequest.getPermissions().isCanUpload());
        user.getPermissions().setPermissionDownload(updateRequest.getPermissions().isCanDownload());
        user.getPermissions().setPermissionEditMetadata(updateRequest.getPermissions().isCanEditMetadata());

        List<Long> libraryIds = updateRequest.getAssignedLibraries();
        if (libraryIds != null) {
            List<LibraryEntity> updatedLibraries = libraryRepository.findAllById(libraryIds);
            user.setLibraries(updatedLibraries);
        }

        userRepository.save(user);
        return bookLoreUserMapper.toDto(user);
    }

    public void deleteUser(Long id) {
        BookLoreUserEntity user = userRepository.findById(id).orElseThrow(() -> ApiError.USER_NOT_FOUND.createException(id));

        if (user.getPermissions().isPermissionAdmin()) {
            throw ApiError.CANNOT_DELETE_ADMIN.createException();
        }

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            if (userDetails.getAuthorities().stream().noneMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"))) {
                throw ApiError.UNAUTHORIZED.createException();
            }
        }

        userRepository.delete(user);
    }

    public BookLoreUser getBookLoreUser(Long id) {
        BookLoreUserEntity user = userRepository.findById(id).orElseThrow(() -> ApiError.USER_NOT_FOUND.createException(id));
        return bookLoreUserMapper.toDto(user);
    }


    public BookPreferences buildDefaultBookPreferences() {
        return BookPreferences.builder()
                .perBookSetting(BookPreferences.PerBookSetting.builder()
                        .epub(BookPreferences.GlobalOrIndividual.Individual)
                        .pdf(BookPreferences.GlobalOrIndividual.Individual)
                        .build())
                .pdfReaderSetting(BookPreferences.PdfReaderSetting.builder()
                        .showSidebar(false)
                        .pageSpread("odd")
                        .pageZoom("page-fit")
                        .build())
                .epubReaderSetting(BookPreferences.EpubReaderSetting.builder()
                        .theme("white")
                        .font("serif")
                        .fontSize(150)
                        .build())
                .build();
    }


    public void updateBookPreferences(long userId, BookPreferences bookPreferences) {
        BookLoreUserEntity user = userRepository.findById(userId).orElseThrow(() -> ApiError.USER_NOT_FOUND.createException(userId));
        user.setBookPreferences(bookPreferences);
        userRepository.save(user);
    }

}

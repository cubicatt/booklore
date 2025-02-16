package com.adityachandel.booklore.service;

import com.adityachandel.booklore.config.security.JwtUtils;
import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookLoreUserMapper;
import com.adityachandel.booklore.model.dto.BookLoreUser;
import com.adityachandel.booklore.model.dto.UserCreateRequest;
import com.adityachandel.booklore.model.dto.request.UserLoginRequest;
import com.adityachandel.booklore.model.dto.request.UserUpdateRequest;
import com.adityachandel.booklore.model.entity.BookLoreUserEntity;
import com.adityachandel.booklore.model.entity.UserPermissionsEntity;
import com.adityachandel.booklore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BookLoreUserMapper bookLoreUserMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public ResponseEntity<Map<String, String>> registerUser(UserCreateRequest request) {
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
        permissions.setPermissionEditMetadata(request.isPermissionManipulateLibrary());

        bookLoreUserEntity.setPermissions(permissions);

        userRepository.save(bookLoreUserEntity);

        String token = jwtUtils.generateToken(bookLoreUserEntity);

        Map<String, String> response = new HashMap<>();
        response.put("token", token);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
}

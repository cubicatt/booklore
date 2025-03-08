package com.adityachandel.booklore.service.user;

import com.adityachandel.booklore.config.security.AuthenticationService;
import com.adityachandel.booklore.config.security.JwtUtils;
import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookLoreUserMapper;
import com.adityachandel.booklore.model.BookPreferences;
import com.adityachandel.booklore.model.dto.BookLoreUser;
import com.adityachandel.booklore.model.dto.request.UserLoginRequest;
import com.adityachandel.booklore.model.dto.request.UserUpdateRequest;
import com.adityachandel.booklore.model.entity.BookLoreUserEntity;
import com.adityachandel.booklore.model.entity.LibraryEntity;
import com.adityachandel.booklore.repository.LibraryRepository;
import com.adityachandel.booklore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BookLoreUserMapper bookLoreUserMapper;
    private final LibraryRepository libraryRepository;
    private final AuthenticationService authenticationService;

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


    public void updateBookPreferences(long userId, BookPreferences bookPreferences) {
        BookLoreUserEntity user = userRepository.findById(userId).orElseThrow(() -> ApiError.USER_NOT_FOUND.createException(userId));
        user.setBookPreferences(bookPreferences);
        userRepository.save(user);
    }

    public BookLoreUser getMyself() {
        BookLoreUser user = authenticationService.getAuthenticatedUser();
        return user;
    }
}

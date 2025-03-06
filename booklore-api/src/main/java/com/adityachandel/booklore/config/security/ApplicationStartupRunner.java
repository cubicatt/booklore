package com.adityachandel.booklore.config.security;

import com.adityachandel.booklore.model.BookPreferences;
import com.adityachandel.booklore.model.entity.BookLoreUserEntity;
import com.adityachandel.booklore.model.entity.UserPermissionsEntity;
import com.adityachandel.booklore.repository.UserRepository;
import com.adityachandel.booklore.service.UserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@AllArgsConstructor
@Component
public class ApplicationStartupRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("admin").isEmpty()) {
            BookLoreUserEntity admin = new BookLoreUserEntity();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setName("Administrator");
            admin.setEmail("admin@example.com");

            UserPermissionsEntity permissions = new UserPermissionsEntity();
            permissions.setUser(admin);
            permissions.setPermissionUpload(true);
            permissions.setPermissionDownload(true);
            permissions.setPermissionManipulateLibrary(true);
            permissions.setPermissionEditMetadata(true);
            permissions.setPermissionAdmin(true);

            BookPreferences bookPreferences = userService.buildDefaultBookPreferences();
            admin.setBookPreferences(bookPreferences);

            admin.setPermissions(permissions);
            userRepository.save(admin);

            log.info("Created admin user {}", admin.getUsername());
        }
    }
}

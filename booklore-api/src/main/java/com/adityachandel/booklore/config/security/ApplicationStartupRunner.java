package com.adityachandel.booklore.config.security;

import com.adityachandel.booklore.model.BookPreferences;
import com.adityachandel.booklore.model.entity.BookLoreUserEntity;
import com.adityachandel.booklore.model.entity.UserPermissionsEntity;
import com.adityachandel.booklore.repository.UserRepository;
import com.adityachandel.booklore.service.user.UserCreatorService;
import com.adityachandel.booklore.service.user.UserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@AllArgsConstructor
@Component
public class ApplicationStartupRunner implements CommandLineRunner {

    private final UserCreatorService userCreatorService;

    @Override
    public void run(String... args) {
        if (!userCreatorService.doesAdminUserExist()) {
            userCreatorService.createAdminUser();
        }
    }
}

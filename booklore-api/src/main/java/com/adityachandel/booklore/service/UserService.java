package com.adityachandel.booklore.service;

import com.adityachandel.booklore.config.security.JwtUtils;
import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.dto.UserCreateRequest;
import com.adityachandel.booklore.model.dto.request.UserLoginRequest;
import com.adityachandel.booklore.model.entity.UserEntity;
import com.adityachandel.booklore.model.entity.UserPermissionsEntity;
import com.adityachandel.booklore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public ResponseEntity<Map<String, String>> registerUser(UserCreateRequest request) {
        Optional<UserEntity> existingUser = userRepository.findByUsername(request.getUsername());
        if (existingUser.isPresent()) {
            throw ApiError.USERNAME_ALREADY_TAKEN.createException(request.getUsername());
        }

        // Create new user entity
        UserEntity userEntity = new UserEntity();
        userEntity.setUsername(request.getUsername());
        userEntity.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userEntity.setName(request.getName());
        userEntity.setEmail(request.getEmail());

        // Create permissions entity with values from the user request
        UserPermissionsEntity permissions = new UserPermissionsEntity();
        permissions.setUser(userEntity);
        permissions.setPermissionUpload(request.isPermissionUpload());
        permissions.setPermissionDownload(request.isPermissionDownload());
        permissions.setPermissionEditMetadata(request.isPermissionEditMetadata());

        // Associate permissions with user
        userEntity.setPermissions(permissions);

        // Save user (CascadeType.ALL ensures permissions are also saved)
        userRepository.save(userEntity);

        // Generate JWT token
        String token = jwtUtils.generateToken(userEntity);

        // Prepare response
        Map<String, String> response = new HashMap<>();
        response.put("token", token);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    public ResponseEntity<Map<String, String>> loginUser(UserLoginRequest loginRequest) {
        UserEntity user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> ApiError.USER_NOT_FOUND.createException(loginRequest.getUsername()));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw ApiError.INVALID_CREDENTIALS.createException();
        }

        String token = jwtUtils.generateToken(user);
        return ResponseEntity.ok(Map.of("token", token));
    }
}

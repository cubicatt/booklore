package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.model.dto.BookLoreUser;
import com.adityachandel.booklore.model.dto.UserCreateRequest;
import com.adityachandel.booklore.model.dto.request.UserLoginRequest;
import com.adityachandel.booklore.model.dto.request.UserUpdateRequest;
import com.adityachandel.booklore.service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    @PreAuthorize("@securityUtil.canViewUserProfile(#id)")
    public ResponseEntity<BookLoreUser> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getBookLoreUser(id));
    }

    @GetMapping
    @PreAuthorize("@securityUtil.isAdmin()")
    public ResponseEntity<List<BookLoreUser>> getAllUsers() {
        return ResponseEntity.ok(userService.getBookLoreUsers());
    }

    @PutMapping("/{id}")
    @PreAuthorize("@securityUtil.isAdmin()")
    public ResponseEntity<BookLoreUser> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest updateRequest) {
        BookLoreUser updatedUser = userService.updateUser(id, updateRequest);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@securityUtil.isAdmin()")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}

package com.adityachandel.booklore.model.dto;

import lombok.Data;

@Data
public class BookLoreUser {
    private Long id;
    private String username;
    private String name;
    private String email;
    private UserPermissions permissions;

    @Data
    public static class UserPermissions {
        private boolean isAdmin;
        private boolean canUpload;
        private boolean canDownload;
        private boolean canEditMetadata;
        private boolean canManipulateLibrary;
    }
}

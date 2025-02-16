package com.adityachandel.booklore.model.dto.request;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String name;
    private String email;
    private Permissions permissions;

    @Data
    public static class Permissions {
        private boolean canUpload;
        private boolean canDownload;
        private boolean canEditMetadata;
    }
}

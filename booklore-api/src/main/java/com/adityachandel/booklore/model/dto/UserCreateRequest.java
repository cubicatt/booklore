package com.adityachandel.booklore.model.dto;

import lombok.Data;

@Data
public class UserCreateRequest {
    private String username;
    private String password;
    private String name;
    private String email;

    private boolean permissionUpload;
    private boolean permissionDownload;
    private boolean permissionEditMetadata;
    private boolean permissionManipulateLibrary;
}
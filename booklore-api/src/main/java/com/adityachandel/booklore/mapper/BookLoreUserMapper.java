package com.adityachandel.booklore.mapper;

import com.adityachandel.booklore.model.dto.BookLoreUser;
import com.adityachandel.booklore.model.entity.BookLoreUserEntity;
import com.adityachandel.booklore.model.entity.UserPermissionsEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BookLoreUserMapper {

    @Mapping(source = "permissions", target = "permissions")
    BookLoreUser toDto(BookLoreUserEntity entity);

    default BookLoreUser.UserPermissions mapPermissions(UserPermissionsEntity permissions) {
        if (permissions == null) {
            return null;
        }
        BookLoreUser.UserPermissions dto = new BookLoreUser.UserPermissions();
        dto.setCanUpload(permissions.isPermissionUpload());
        dto.setCanDownload(permissions.isPermissionDownload());
        dto.setCanEditMetadata(permissions.isPermissionEditMetadata());
        return dto;
    }
}

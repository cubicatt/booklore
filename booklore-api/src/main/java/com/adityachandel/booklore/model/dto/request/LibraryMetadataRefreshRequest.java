package com.adityachandel.booklore.model.dto.request;

import com.adityachandel.booklore.service.metadata.model.MetadataProvider;
import lombok.Data;

@Data
public class LibraryMetadataRefreshRequest {
    private Long libraryId;
    private MetadataProvider metadataProvider;
    private boolean replaceCover;
}

package com.adityachandel.booklore.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PdfViewerPreferences {
    private Long bookId;
    private String zoom;
    private Boolean sidebarVisible;
    private String spread;
}
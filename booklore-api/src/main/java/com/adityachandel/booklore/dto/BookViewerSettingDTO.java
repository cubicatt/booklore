package com.adityachandel.booklore.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookViewerSettingDTO {
    private int pageNumber;
    private String zoom;
    private boolean sidebar_visible;
    private String spread;
}
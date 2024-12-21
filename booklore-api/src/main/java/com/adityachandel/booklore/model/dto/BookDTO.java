package com.adityachandel.booklore.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookDTO {
    private Long id;
    private Long libraryId;
    private String fileName;
    private String title;
    private Instant lastReadTime;
    private Instant addedOn;
    private BookMetadataDTO metadata;
    private List<ShelfDTO> shelves;
}

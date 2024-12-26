package com.adityachandel.booklore.model.dto;

import com.adityachandel.booklore.model.entity.Sort;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Builder
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShelfDTO {
    private Long id;
    private String name;
    private Sort sort;
}

package com.adityachandel.booklore.model.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class Award {
    private String name;
    private LocalDate awardedAt;
    private String category;
    private String designation;
}

package com.adityachandel.booklore.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookDTO {
    private Long id;
    private Long libraryId;
    private String fileName;
    private String title;
    private List<AuthorDTO> authors = new ArrayList<>();
}

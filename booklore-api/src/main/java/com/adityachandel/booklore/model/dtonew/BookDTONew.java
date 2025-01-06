package com.adityachandel.booklore.model.dtonew;

import jakarta.persistence.Column;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookDTONew {
    private Long id;
    private String fileName;
    private String path;
    private BookMetadataDTONew metadata;
    private List<AuthorDTONew> authors;
    private List<CategoryDTONew> categories;
}

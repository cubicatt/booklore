package com.adityachandel.booklore.model.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReadProgressRequest {
    @NotNull
    private Long bookId;
    private String epubProgress;
    private Integer pdfProgress;

    @AssertTrue(message = "Either epubProgress or pdfProgress must be provided")
    public boolean isProgressValid() {
        return epubProgress != null || pdfProgress != null;
    }
}

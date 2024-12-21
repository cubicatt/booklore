package com.adityachandel.booklore.model.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class AssignShelvesRequest {
    private Long bookId;
    private List<Long> shelfIds;
}

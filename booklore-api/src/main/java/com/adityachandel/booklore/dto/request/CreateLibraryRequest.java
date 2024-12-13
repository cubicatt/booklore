package com.adityachandel.booklore.dto.request;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CreateLibraryRequest {
    private String name;
    private List<String> paths;
}

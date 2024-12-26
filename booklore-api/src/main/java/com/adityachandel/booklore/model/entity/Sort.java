package com.adityachandel.booklore.model.entity;

import com.adityachandel.booklore.model.enums.SortDirection;
import lombok.Data;

@Data
public class Sort {
    private String sortField;
    private SortDirection sortDirection;
}

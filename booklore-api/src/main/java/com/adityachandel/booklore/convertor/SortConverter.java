package com.adityachandel.booklore.convertor;

import com.adityachandel.booklore.model.entity.Sort;
import com.adityachandel.booklore.model.enums.SortDirection;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class SortConverter implements AttributeConverter<Sort, String> {

    @Override
    public String convertToDatabaseColumn(Sort sort) {
        if (sort == null) {
            return null;
        }
        return sort.getSortField() + "," + sort.getSortDirection().name();
    }

    @Override
    public Sort convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }
        String[] parts = dbData.split(",");
        Sort sort = new Sort();
        sort.setSortField(parts[0]);
        sort.setSortDirection(SortDirection.valueOf(parts[1]));
        return sort;
    }
}

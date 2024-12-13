package com.adityachandel.booklore.convertor;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Converter
public class PathsConverter implements AttributeConverter<List<String>, String> {

    private static final String DELIMITER = ";";

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        return attribute.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .collect(Collectors.joining(DELIMITER));
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }
        return Arrays.stream(dbData.split(DELIMITER))
                .filter(Objects::nonNull)
                .map(String::trim)
                .collect(Collectors.toList());
    }
}

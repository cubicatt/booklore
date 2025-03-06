package com.adityachandel.booklore.convertor;

import com.adityachandel.booklore.model.BookPreferences;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BookPreferencesConverter implements AttributeConverter<BookPreferences, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(BookPreferences preferences) {
        try {
            return objectMapper.writeValueAsString(preferences);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error converting BookPreferences to JSON", e);
        }
    }

    @Override
    public BookPreferences convertToEntityAttribute(String json) {
        try {
            return objectMapper.readValue(json, BookPreferences.class);
        } catch (Exception e) {
            throw new RuntimeException("Error converting JSON to BookPreferences", e);
        }
    }
}

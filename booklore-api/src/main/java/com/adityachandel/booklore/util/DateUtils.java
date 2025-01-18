package com.adityachandel.booklore.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.regex.Pattern;

public class DateUtils {

    private static final String DATE_FORMAT_REGEX = "^[A-Za-z]+\\s[0-9]{1,2},\\s[0-9]{4}$";

    public static String parseDateToInstant(String dateString) {
        if (dateString == null || dateString.trim().isEmpty() || !Pattern.matches(DATE_FORMAT_REGEX, dateString)) {
            return dateString;
        }
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH);
            LocalDate localDate = LocalDate.parse(dateString, formatter);
            Instant instant = localDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
            LocalDate finalDate = instant.atZone(ZoneId.systemDefault()).toLocalDate();
            return finalDate.toString();
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}
package com.adityachandel.booklore.util;

public class BookUtils {

    public static String cleanFileName(String fileName) {
        if (fileName == null) {
            return null;
        }
        fileName = fileName.replace("(Z-Library)", "").trim();

        // Remove the author name inside parentheses (e.g. (Jon Yablonski))
        fileName = fileName.replaceAll("\\s?\\(.*?\\)", "").trim();

        // Remove the file extension (e.g., .pdf, .docx)
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > 0) {
            fileName = fileName.substring(0, dotIndex).trim();
        }

        return fileName;
    }
}

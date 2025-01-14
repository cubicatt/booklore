package com.adityachandel.booklore.service;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

@Service
public class EpubService {

    // Method to retrieve the EPUB file as a ByteArrayResource
    public ByteArrayResource getEpubFile(Long bookId) throws IOException {
        String bookPath = "/Users/aditya.chandel/Downloads/Harry1.epub"; // Example path
        File file = new File(bookPath);
        if (!file.exists()) {
            throw new IOException("EPUB file not found for book id: " + bookId);
        }

        // Convert the EPUB file to a byte array
        try (FileInputStream inputStream = new FileInputStream(file)) {
            byte[] fileContent = inputStream.readAllBytes();
            return new ByteArrayResource(fileContent);
        }
    }
}
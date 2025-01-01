package com.adityachandel.booklore.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;


@Getter
public enum ApiError {
    AUTHOR_NOT_FOUND(HttpStatus.NOT_FOUND, "Author not found with ID: %d"),
    BOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "Book not found with ID: %d"),
    FILE_READ_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Error reading files from path"),
    IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "Image not found or not readable"),
    INVALID_FILE_FORMAT(HttpStatus.BAD_REQUEST, "Invalid file format, only pdf and epub are supported"),
    LIBRARY_NOT_FOUND(HttpStatus.NOT_FOUND, "Library not found with ID: %d"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "Bad request"),
    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "File size exceeds the limit: 100 MB"),
    DIRECTORY_CREATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create the directory: %s"),
    INVALID_LIBRARY_PATH(HttpStatus.BAD_REQUEST, "Invalid library path"),
    FILE_ALREADY_EXISTS(HttpStatus.CONFLICT, "File already exists"),
    INVALID_QUERY_PARAMETERS(HttpStatus.BAD_REQUEST, "Query parameters are required for the search."),
    SHELF_ALREADY_EXISTS(HttpStatus.CONFLICT, "Shelf already exists: %s"),
    SHELF_NOT_FOUND(HttpStatus.NOT_FOUND, "Shelf not found with ID: %d"),
    METADATA_SOURCE_NOT_IMPLEMENT_OR_DOES_NOT_EXIST(HttpStatus.BAD_REQUEST, "Metadata source not implement or does not exist" ),;

    private final HttpStatus status;
    private final String message;

    ApiError(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public APIException createException(Object... details) {
        String formattedMessage = (details.length > 0) ? String.format(message, details) : message;
        return new APIException(formattedMessage, this.status);
    }
}

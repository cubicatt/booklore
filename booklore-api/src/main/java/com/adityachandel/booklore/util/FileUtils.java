package com.adityachandel.booklore.util;

import com.adityachandel.booklore.model.entity.BookEntity;

import java.nio.file.Path;
import java.util.Optional;

public class FileUtils {

    public static String getBookFullPath(BookEntity bookEntity) {
        return bookEntity.getLibraryPath().getPath() + "/" + bookEntity.getFileSubPath() + "/" + bookEntity.getFileName();
    }

    public static String getRelativeSubPath(String basePath, Path fullFilePath) {
        return Optional.ofNullable(Path.of(basePath)
                        .relativize(fullFilePath)
                        .getParent())
                .map(Path::toString)
                .map(path -> path.replace("\\", "/"))
                .orElse("");
    }
}
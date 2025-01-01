package com.adityachandel.booklore.util;

import com.adityachandel.booklore.config.AppProperties;
import com.adityachandel.booklore.exception.ApiError;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@RequiredArgsConstructor
@Service
public class FileService {

    private final AppProperties appProperties;

    public Resource getBookCover(String thumbnailPath) {
        Path filePath = Paths.get(thumbnailPath);
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw ApiError.IMAGE_NOT_FOUND.createException(filePath);
            }
        } catch (IOException e) {
            throw ApiError.IMAGE_NOT_FOUND.createException(filePath);
        }
    }

    /*private String getCurrentThumbnail(String bookThumbFolder) {
        File directory = new File(bookThumbFolder);
        if (!directory.isDirectory()) {
            log.error("Invalid directory path: {}", bookThumbFolder);
            return null;
        }
        File[] files = directory.listFiles((dir, name) -> name.endsWith("-current.jpg"));
        if (files == null || files.length == 0) {
            log.info("No file ending with '-current.jpg' found in directory: {}", bookThumbFolder);
            return null;
        }
        return files[0].getPath();
    }*/

    public String createThumbnail(long bookId, String thumbnailUrl, String suffix) throws IOException {
        String newFilename = suffix + ".jpg";
        resizeAndSaveImage(thumbnailUrl, new File(getThumbnailPath(bookId)), newFilename);
        return getThumbnailPath(bookId) + newFilename;
        //removeOldCurrent(bookId, prefix);
    }

    /*public void removeOldCurrent(long bookId, String except) {
        String thumbnailPath = getThumbnailPath(bookId);
        File directory = new File(thumbnailPath);
        if (!directory.isDirectory()) {
            log.error("Invalid directory path: {}", thumbnailPath);
            return;
        }
        File[] files = directory.listFiles((dir, name) ->
                name.endsWith(".jpg") && !name.equals(except + "-current.jpg") && name.contains("-current"));
        if (files == null || files.length == 0) {
            log.info("No matching files to process in directory: {}", thumbnailPath);
            return;
        }
        for (File file : files) {
            File newFile = new File(file.getParent(), file.getName().replace("-current", ""));
            if (file.renameTo(newFile)) {
                log.info("Renamed: {} -> {}", file.getName(), newFile.getName());
            } else {
                log.error("Failed to rename: {}", file.getName());
            }
        }
    }*/

    private void resizeAndSaveImage(String imageUrl, File outputFolder, String outputFileName) throws IOException {
        BufferedImage originalImage;
        try (InputStream inputStream = new URL(imageUrl).openStream()) {
            originalImage = ImageIO.read(inputStream);
        }
        if (originalImage == null) {
            throw new IOException("Failed to read image from URL: " + imageUrl);
        }
        BufferedImage resizedImage = resizeImage(originalImage);
        if (!outputFolder.exists() && !outputFolder.mkdirs()) {
            throw new IOException("Failed to create output directory: " + outputFolder.getAbsolutePath());
        }
        File outputFile = new File(outputFolder, outputFileName);
        ImageIO.write(resizedImage, "JPEG", outputFile);
        log.info("Image saved to: {}", outputFile.getAbsolutePath());
    }

    private BufferedImage resizeImage(BufferedImage originalImage) {
        BufferedImage resizedImage = new BufferedImage(250, 350, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resizedImage.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(originalImage, 0, 0, 250, 350, null);
        g2d.dispose();
        return resizedImage;
    }

    public String getThumbnailPath(long bookId) {
        return appProperties.getPathConfig() + "/thumbs/" + bookId + "/";
    }

}

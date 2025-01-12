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
        Path thumbPath;
        if (thumbnailPath == null || thumbnailPath.isEmpty()) {
            thumbPath = Paths.get(getMissingThumbnailPath());
        } else {
            thumbPath = Paths.get(thumbnailPath);
        }
        try {
            Resource resource = new UrlResource(thumbPath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw ApiError.IMAGE_NOT_FOUND.createException(thumbPath);
            }
        } catch (IOException e) {
            throw ApiError.IMAGE_NOT_FOUND.createException(thumbPath);
        }
    }

    public String createThumbnail(long bookId, String thumbnailUrl) throws IOException {
        String newFilename = "c.jpg";
        resizeAndSaveImage(thumbnailUrl, new File(getThumbnailPath(bookId)), newFilename);
        return getThumbnailPath(bookId) + newFilename;
    }

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

    public String getMissingThumbnailPath() {
        return appProperties.getPathConfig() + "/thumbs/missing/m.jpg";
    }

}

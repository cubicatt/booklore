package com.adityachandel.booklore.service.fileprocessing;

import com.adityachandel.booklore.config.AppProperties;
import com.adityachandel.booklore.model.entity.BookMetadataEntity;
import lombok.AllArgsConstructor;
import org.apache.pdfbox.rendering.ImageType;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

@AllArgsConstructor
@Service
public class FileProcessingUtils {

    private final AppProperties appProperties;

    public void setBookCoverPath(long bookId, BookMetadataEntity bookMetadataEntity) {
        bookMetadataEntity.setThumbnail(appProperties.getPathConfig() + "/thumbs/" + bookId + "/f.jpg");
    }

    public boolean saveCoverImage(BufferedImage coverImage, long bookId) throws IOException {
        File coverDirectory = new File(appProperties.getPathConfig() + "/thumbs");
        BufferedImage resizedImage = resizeImage(coverImage, 250, 350);
        File bookDirectory = new File(coverDirectory, String.valueOf(bookId));
        if (!bookDirectory.exists()) {
            if (!bookDirectory.mkdirs()) {
                throw new IOException("Failed to create directory: " + bookDirectory.getAbsolutePath());
            }
        }
        String coverImageName = "f.jpg";
        File coverImageFile = new File(bookDirectory, coverImageName);
        return ImageIO.write(resizedImage, "JPEG", coverImageFile);
    }

    public BufferedImage resizeImage(BufferedImage originalImage, int width, int height) {
        Image tmp = originalImage.getScaledInstance(width, height, Image.SCALE_SMOOTH);
        BufferedImage resizedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resizedImage.createGraphics();
        g2d.drawImage(tmp, 0, 0, null);
        g2d.dispose();
        return resizedImage;
    }
}

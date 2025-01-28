package com.adityachandel.booklore.service.monitoring;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;

@Slf4j
@Service
@AllArgsConstructor
public class MonitoringTask {

    private final WatchService watchService;
    private final ApplicationEventPublisher eventPublisher;

    private static final String PDF_EXTENSION = ".pdf";
    private static final String EPUB_EXTENSION = ".epub";

    @Async
    public void monitor() {
        log.info("START_MONITORING");
        try {
            WatchKey key;
            while ((key = watchService.take()) != null) {
                for (WatchEvent<?> event : key.pollEvents()) {
                    WatchEvent.Kind<?> kind = event.kind();
                    Path fileName = (Path) event.context();
                    Path directory = (Path) key.watchable();
                    Path fullPath = directory.resolve(fileName);
                    if (isPdfOrEpub(fileName)) {
                        log.info("Event kind: {}; File affected: {}; Full path: {}; Watched folder: {}",
                                kind,
                                fileName,
                                fullPath,
                                directory);
                        eventPublisher.publishEvent(new FileChangeEvent(this, fullPath, kind, directory));
                    }
                }
                key.reset();
            }
        } catch (InterruptedException e) {
            log.warn("Monitoring task interrupted", e);
            Thread.currentThread().interrupt();
        }
    }

    private boolean isPdfOrEpub(Path fileName) {
        String fileNameStr = fileName.toString().toLowerCase();
        return fileNameStr.endsWith(PDF_EXTENSION) || fileNameStr.endsWith(EPUB_EXTENSION);
    }
}
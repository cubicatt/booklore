package com.adityachandel.booklore.service.monitoring;

import com.adityachandel.booklore.model.dto.Library;
import com.adityachandel.booklore.service.LibraryProcessingService;
import com.adityachandel.booklore.service.LibraryService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@AllArgsConstructor
public class MonitoringService {

    private final LibraryProcessingService libraryProcessingService;
    private final WatchService watchService;
    private final LibraryService libraryService;
    private final MonitoringTask monitoringTask;
    private final Set<Path> monitoredPaths = ConcurrentHashMap.newKeySet();
    private final Map<Path, Long> pathToLibraryIdMap = new ConcurrentHashMap<>();

    @PostConstruct
    public void initializeMonitoring() {
        log.info("Initializing monitoring service...");
        loadInitialPaths();
        monitoringTask.monitor();
    }

    private void loadInitialPaths() {
        libraryService.getAllLibraries()
                .stream()
                .filter(Library::isWatch)
                .forEach(library -> {
                    library.getPaths().forEach(libraryPath -> {
                        Path path = Paths.get(libraryPath.getPath());
                        if (Files.isDirectory(path)) {
                            pathToLibraryIdMap.put(path, library.getId()); // Map path to libraryId
                            registerPathWithLibraryId(path);
                        }
                    });
                });

        log.info("Loaded initial monitored folders: {}", pathToLibraryIdMap);
    }

    public synchronized void registerPathWithLibraryId(Path path) {
        try {
            if (monitoredPaths.add(path)) {
                path.register(watchService,
                        StandardWatchEventKinds.ENTRY_CREATE,
                        StandardWatchEventKinds.ENTRY_MODIFY,
                        StandardWatchEventKinds.ENTRY_DELETE);
                log.info("Registered folder for monitoring: {}", path);
            } else {
                log.warn("Path is already registered: {}", path);
            }
        } catch (IOException e) {
            log.error("Error registering path: {}", path, e);
        }
    }

    public synchronized void unregisterPath(String folderPath) {
        Path path = Paths.get(folderPath);
        if (monitoredPaths.remove(path)) {
            pathToLibraryIdMap.remove(path); // Remove the path-to-libraryId mapping
            log.info("Unregistered folder from monitoring: {}", folderPath);
        } else {
            log.warn("Folder not found in monitored paths: {}", folderPath);
        }
    }

    @EventListener
    public void handleFileChangeEvent(FileChangeEvent event) {
        Path filePath = event.getFilePath();
        Path watchedFolder = event.getWatchedFolder();
        Long libraryId = pathToLibraryIdMap.get(watchedFolder);
        if (libraryId != null) {
            Thread.startVirtualThread(() -> {
                try {
                    libraryProcessingService.processFile(libraryId, watchedFolder.toString(), filePath.toString());
                } catch (InvalidDataAccessApiUsageException e) {
                    log.warn("InvalidDataAccessApiUsageException - Library id: {}", libraryId);
                }
                log.info("Parsing task completed!");
            });
            log.info("Handling file change event for library {}: {} (from folder: {}) with kind: {}", libraryId, filePath, watchedFolder, event.getEventKind());
        } else {
            log.warn("No libraryId found for watched folder: {}", watchedFolder);
        }
    }

    @PreDestroy
    public void stopMonitoring() {
        log.info("Shutting down monitoring service...");
        if (watchService != null) {
            try {
                watchService.close();
            } catch (IOException e) {
                log.error("Exception while closing the WatchService", e);
            }
        }
    }
}
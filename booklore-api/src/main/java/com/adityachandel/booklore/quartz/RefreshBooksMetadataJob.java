package com.adityachandel.booklore.quartz;

import com.adityachandel.booklore.model.dto.request.BooksMetadataRefreshRequest;
import com.adityachandel.booklore.model.dto.request.LibraryMetadataRefreshRequest;
import com.adityachandel.booklore.service.metadata.BookMetadataService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Slf4j
@Component
@AllArgsConstructor
@DisallowConcurrentExecution
public class RefreshBooksMetadataJob implements Job {

    private BookMetadataService bookMetadataService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        try {
            BooksMetadataRefreshRequest request = (BooksMetadataRefreshRequest) context.getMergedJobDataMap().get("request");
            log.info("Refreshing metadata for Books: {}", request.getBookIds().stream().map(String::valueOf).collect(Collectors.joining(", ")));
            bookMetadataService.refreshBooksMetadata(request);
        } catch (Exception e) {
            throw new JobExecutionException("Error occurred while executing metadata refresh job", e);
        }
    }
}

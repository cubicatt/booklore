package com.adityachandel.booklore.quartz;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.dto.request.BooksMetadataRefreshRequest;
import com.adityachandel.booklore.model.dto.request.LibraryMetadataRefreshRequest;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshRequest;
import lombok.AllArgsConstructor;
import org.quartz.*;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class JobSchedulerService {

    private final Scheduler scheduler;

    public void scheduleMetadataRefresh(LibraryMetadataRefreshRequest request) {
        scheduleJob(request, RefreshLibraryMetadataJob.class, "libraryMetadataJob");
    }

    public void scheduleMetadataRefreshV2(MetadataRefreshRequest request) {
        scheduleJob(request, RefreshMetadataJobV2.class, "libraryMetadataJobV2");
    }

    public void scheduleBookMetadataRefresh(BooksMetadataRefreshRequest request) {
        scheduleJob(request, RefreshBooksMetadataJob.class, "booksMetadataJob");
    }

    private <T> void scheduleJob(T request, Class<? extends Job> jobClass, String name) {
        try {
            JobDataMap jobDataMap = new JobDataMap();
            jobDataMap.put("request", request);

            JobDetail jobDetail = JobBuilder.newJob(jobClass)
                    .withIdentity(name, "Metadata")
                    .usingJobData(jobDataMap)
                    .build();

            Trigger trigger = TriggerBuilder.newTrigger()
                    .forJob(jobDetail)
                    .withIdentity(name, "Metadata")
                    .startNow()
                    .build();

            scheduler.scheduleJob(jobDetail, trigger);
        } catch (SchedulerException e) {
            handleSchedulerException(e);
        }
    }

    private void handleSchedulerException(Exception e) {
        if (e.getMessage() != null && e.getMessage().contains("already exists")) {
            throw ApiError.ANOTHER_METADATA_JOB_RUNNING.createException();
        }
        throw ApiError.SCHEDULE_REFRESH_ERROR.createException(e.getMessage());
    }

}
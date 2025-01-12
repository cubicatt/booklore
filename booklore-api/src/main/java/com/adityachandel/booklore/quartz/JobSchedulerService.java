package com.adityachandel.booklore.quartz;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshRequest;
import lombok.AllArgsConstructor;
import org.quartz.*;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class JobSchedulerService {

    private final Scheduler scheduler;

    public void scheduleMetadataRefreshV2(MetadataRefreshRequest request) {
        scheduleJob(request);
    }

    private <T> void scheduleJob(T request) {
        try {
            JobDataMap jobDataMap = new JobDataMap();
            jobDataMap.put("request", request);

            JobDetail jobDetail = JobBuilder.newJob(RefreshMetadataJob.class)
                    .withIdentity("metadataRefreshJobV2", "metadataRefreshJobV2")
                    .usingJobData(jobDataMap)
                    .build();

            Trigger trigger = TriggerBuilder.newTrigger()
                    .forJob(jobDetail)
                    .withIdentity("metadataRefreshJobV2", "metadataRefreshJobV2")
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
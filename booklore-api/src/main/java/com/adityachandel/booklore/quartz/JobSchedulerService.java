package com.adityachandel.booklore.quartz;

import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.model.dto.request.MetadataRefreshRequest;
import lombok.AllArgsConstructor;
import org.quartz.*;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class JobSchedulerService {

    private Scheduler scheduler;

    public void scheduleMetadataRefresh(MetadataRefreshRequest request) {
        try {
            JobDataMap jobDataMap = new JobDataMap();
            jobDataMap.put("request", request);

            JobDetail jobDetail = JobBuilder.newJob(RefreshMetadataJob.class)
                    .withIdentity("refreshMetadataJob", "Metadata")
                    .usingJobData(jobDataMap)
                    .build();

            Trigger trigger = TriggerBuilder.newTrigger()
                    .forJob(jobDetail)
                    .withIdentity("refreshMetadataTrigger", "Metadata")
                    .startNow()
                    .build();

            scheduler.scheduleJob(jobDetail, trigger);
        } catch (Exception e) {
            throw ApiError.SCHEDULE_REFRESH_ERROR.createException(e.getMessage());
        }
    }
}

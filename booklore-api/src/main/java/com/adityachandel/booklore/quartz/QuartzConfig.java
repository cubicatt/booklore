package com.adityachandel.booklore.quartz;

import lombok.AllArgsConstructor;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.SpringBeanJobFactory;

@Configuration
@AllArgsConstructor
public class QuartzConfig {

    private ApplicationContext applicationContext;

    @Bean
    public SpringBeanJobFactory springBeanJobFactory() {
        SpringBeanJobFactory jobFactory = new SpringBeanJobFactory();
        jobFactory.setApplicationContext(applicationContext);
        return jobFactory;
    }
}

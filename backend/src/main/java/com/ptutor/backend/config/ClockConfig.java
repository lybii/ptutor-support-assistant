package com.ptutor.backend.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        // UTC: SupportRequestService ghi assignedAt/answeredAt theo clock và đổi createdAt (giờ JVM) về UTC khi tính thống kê.
        return Clock.systemUTC();
    }
}

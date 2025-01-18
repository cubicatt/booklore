package com.adityachandel.booklore.controller;

import com.adityachandel.booklore.model.dto.settings.AppSettings;
import com.adityachandel.booklore.model.dto.settings.SettingRequest;
import com.adityachandel.booklore.service.AppSettingService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
public class AppSettingController {

    private AppSettingService appSettingService;

    @GetMapping("/api/settings")
    public AppSettings getAppSettings() {
        return appSettingService.getAppSettings();
    }

    @PutMapping("/api/settings")
    public void updateSetting(@RequestBody SettingRequest settingRequest) {
        appSettingService.updateSetting(settingRequest.getCategory(), settingRequest.getName(), settingRequest.getValue());
    }
}
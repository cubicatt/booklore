package com.adityachandel.booklore.service;

import com.adityachandel.booklore.model.dto.settings.AppSettings;
import com.adityachandel.booklore.model.entity.AppSettingEntity;
import com.adityachandel.booklore.repository.AppSettingsRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class AppSettingService {

    private AppSettingsRepository appSettingsRepository;

    public AppSettings getAppSettings() {
        List<AppSettingEntity> settings = appSettingsRepository.findAll();
        Map<String, Map<String, String>> settingsMap = settings.stream().collect(Collectors.groupingBy(AppSettingEntity::getCategory, Collectors.toMap(AppSettingEntity::getName, AppSettingEntity::getVal)));
        AppSettings appSettings = new AppSettings();
        if (settingsMap.containsKey("epub")) {
            Map<String, String> epubSettings = settingsMap.get("epub");
            appSettings.setEpub(new AppSettings.EpubSettings(epubSettings.get("theme"), epubSettings.get("fontSize"), epubSettings.get("font")));
        }
        if (settingsMap.containsKey("pdf")) {
            Map<String, String> pdfSettings = settingsMap.get("pdf");
            appSettings.setPdf(new AppSettings.PdfSettings(pdfSettings.get("spread"), pdfSettings.get("zoom"), Boolean.parseBoolean(pdfSettings.get("sidebar"))));
        }
        return appSettings;
    }

    @Transactional
    public void updateSetting(String category, String name, String newValue) {
        AppSettingEntity setting = appSettingsRepository.findByCategoryAndName(category, name);
        if (setting != null) {
            setting.setVal(newValue);
            appSettingsRepository.save(setting);
        } else {
            throw new IllegalArgumentException("Setting not found for category: " + category + " and key: " + name);
        }
    }
}

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
        Map<String, Map<String, String>> settingsMap = settings.stream()
                .collect(Collectors.groupingBy(AppSettingEntity::getCategory,
                        Collectors.toMap(AppSettingEntity::getName, AppSettingEntity::getVal)));

        AppSettings.AppSettingsBuilder appSettingsBuilder = AppSettings.builder();

        if (settingsMap.containsKey("epub")) {
            Map<String, String> epubSettings = settingsMap.get("epub");
            appSettingsBuilder.epub(AppSettings.EpubSettings.builder()
                    .theme(epubSettings.get("theme"))
                    .fontSize(epubSettings.get("fontSize"))
                    .font(epubSettings.get("font"))
                    .build());
        }

        if (settingsMap.containsKey("pdf")) {
            Map<String, String> pdfSettings = settingsMap.get("pdf");
            appSettingsBuilder.pdf(AppSettings.PdfSettings.builder()
                    .spread(pdfSettings.get("spread"))
                    .zoom(pdfSettings.get("zoom"))
                    .sidebar(Boolean.parseBoolean(pdfSettings.get("sidebar")))
                    .build());
        }

        if (settingsMap.containsKey("reader_setting")) {
            Map<String, String> readerSetting = settingsMap.get("reader_setting");
            appSettingsBuilder.readerSettings(AppSettings.ReaderSettings.builder()
                    .pdfScope(AppSettings.SettingScope.valueOf(readerSetting.get("pdf")))
                    .epubScope(AppSettings.SettingScope.valueOf(readerSetting.get("epub")))
                    .build());
        }
        return appSettingsBuilder.build();
    }

    @Transactional
    public void updateSetting(String category, String name, String val) {
        AppSettingEntity setting = appSettingsRepository.findByCategoryAndName(category, name);
        if (setting != null) {
            setting.setVal(val);
            appSettingsRepository.save(setting);
        } else {
            throw new IllegalArgumentException("Setting not found for category: " + category + " and key: " + name);
        }
    }
}

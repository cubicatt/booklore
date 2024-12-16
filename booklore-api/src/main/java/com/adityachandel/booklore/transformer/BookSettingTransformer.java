package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.model.dto.BookViewerSettingDTO;
import com.adityachandel.booklore.model.entity.BookViewerSetting;

public class BookSettingTransformer {

    public static BookViewerSettingDTO convertToDTO(BookViewerSetting bookViewerSetting) {
        return BookViewerSettingDTO.builder()
                .zoom(bookViewerSetting.getZoom())
                .pageNumber(bookViewerSetting.getPageNumber())
                .spread(bookViewerSetting.getSpread())
                .sidebar_visible(bookViewerSetting.isSidebar_visible())
                .build();
    }
}

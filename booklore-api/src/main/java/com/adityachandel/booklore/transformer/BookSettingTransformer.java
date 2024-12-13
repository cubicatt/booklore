package com.adityachandel.booklore.transformer;

import com.adityachandel.booklore.dto.BookViewerSettingDTO;
import com.adityachandel.booklore.entity.BookViewerSetting;

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

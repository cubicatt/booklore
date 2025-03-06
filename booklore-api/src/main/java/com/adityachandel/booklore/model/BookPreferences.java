package com.adityachandel.booklore.model;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookPreferences {

    private PerBookSetting perBookSetting;
    private PdfReaderSetting pdfReaderSetting;
    private EpubReaderSetting epubReaderSetting;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EpubReaderSetting {
        private String theme;
        private String font;
        private int fontSize;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PdfReaderSetting {
        private String pageSpread;
        private String pageZoom;
        private boolean showSidebar;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerBookSetting {
        private GlobalOrIndividual pdf;
        private GlobalOrIndividual epub;
    }

    public enum GlobalOrIndividual {
        Global, Individual
    }
}
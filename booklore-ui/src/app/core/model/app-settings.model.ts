export interface EpubSettings {
  theme: string;
  fontSize: number;
  font: string;
  page: string;
}

export interface PdfSettings {
  spread: 'off' | 'even' | 'odd';
  zoom: string;
  sidebar: boolean;
  page: number;
}

export interface ReaderSettings {
  pdfScope: 'Global' | 'Individual';
  epubScope: 'Global' | 'Individual';
}

export interface AppSettings {
  epub?: EpubSettings;
  pdf?: PdfSettings;
  readerSettings?: ReaderSettings;
}

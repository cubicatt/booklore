export interface EpubSettings {
  theme: string;
  fontSize: string;
  font: string;
}

export interface PdfSettings {
  spread: 'off' | 'even' | 'odd';
  zoom: string;
  sidebar: boolean;
}

export interface AppSettings {
  epub?: EpubSettings;
  pdf?: PdfSettings;
}

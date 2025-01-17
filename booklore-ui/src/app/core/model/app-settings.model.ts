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

export interface AppSettings {
  epub?: EpubSettings;
  pdf?: PdfSettings;
}

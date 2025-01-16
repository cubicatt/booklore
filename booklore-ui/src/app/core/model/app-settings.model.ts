export interface EpubSettings {
  theme: string;
  fontSize: string;
  font: string;
}

export interface PdfSettings {
  spread: string;
  zoom: string;
  sidebar: boolean;
}

export interface AppSettings {
  epub?: EpubSettings;
  pdf?: PdfSettings;
}

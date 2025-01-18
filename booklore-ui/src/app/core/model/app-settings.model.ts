import {MetadataRefreshOptions} from '../../metadata/model/request/metadata-refresh-options.model';

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
  pdfScope: 'global' | 'individual';
  epubScope: 'global' | 'individual';
}

export interface AppSettings {
  epub?: EpubSettings;
  pdf?: PdfSettings;
  readerSettings?: ReaderSettings;
  metadataRefreshOptions: MetadataRefreshOptions;
}

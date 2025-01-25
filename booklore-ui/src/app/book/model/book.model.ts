import {Shelf} from './shelf.model';

export type BookType = "PDF" | "EPUB";

export interface Book {
  id: number;
  bookType: BookType;
  libraryId: number;
  metadata?: BookMetadata;
  shelves?: Shelf[];
  lastReadTime?: string;
  addedOn?: string;
  epubProgress?: string;
  pdfProgress?: number;
}

export interface BookMetadata {
  bookId: number;
  title: string;
  subtitle?: string;
  publisher?: string;
  publishedDate?: string;
  description?: string;
  isbn13?: string;
  isbn10?: string;
  asin?: string;
  pageCount?: number | null;
  language?: string;
  rating?: number | null;
  reviewCount?: number | null;
  coverUpdatedOn?: string;
  authors: Author[];
  categories: Category[];
  awards?: Award[];

  [key: string]: any;
}

export interface FetchedMetadata {
  bookId: number | null;
  provider: string;
  providerBookId: string;
  title: string | null;
  subtitle?: string | null;
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  isbn13: string | null;
  isbn10: string | null;
  asin: string | null;
  pageCount: number | null;
  thumbnailUrl: string | undefined;
  language: string | null;
  rating: number | null;
  reviewCount: number | null;
  authors: string[];
  categories: string[];

  [key: string]: any;
}

export interface Author {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Award {
  name: string;
  category: string;
  designation: string;
  awardedAt: string;
}

export interface PdfViewerSetting {
  zoom: string | number;
  sidebarVisible: boolean;
  spread: 'off' | 'even' | 'odd';
}

export interface EpubViewerSetting {
  theme: string;
  font: string;
  fontSize: number;
}

export interface BookSetting {
  pdfSettings?: PdfViewerSetting;
  epubSettings?: EpubViewerSetting;

  [key: string]: any;
}

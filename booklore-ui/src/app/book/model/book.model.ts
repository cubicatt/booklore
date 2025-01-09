import {Shelf} from './shelf.model';

export interface Book {
  id: number;
  libraryId: number;
  metadata?: BookMetadata;
  shelves?: Shelf[];
  lastReadTime?: string;
  addedOn?: string;
}

export interface BookMetadata {
  title: string;
  subtitle?: string;
  publisher: string;
  publishedDate: string;
  description?: string;
  isbn13: string;
  isbn10: string;
  asin?: string;
  pageCount: number;
  language: string;
  rating: number;
  reviewCount: number;
  authors: Author[];
  categories: Category[];
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

export interface BookWithNeighborsDTO {
  currentBook: Book;
  previousBookId: number | null;
  nextBookId: number | null;
}

export interface BookSetting {
  pageNumber: number;
  zoom: number | string;
  sidebar_visible: boolean;
  spread: 'off' | 'even' | 'odd';
}

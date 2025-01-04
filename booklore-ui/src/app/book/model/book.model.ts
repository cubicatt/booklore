import {Shelf} from './shelf.model';
import {SafeUrl} from '@angular/platform-browser';

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
  authors: Author[];
  categories: Category[];
  publisher: string;
  publishedDate: string;
  isbn10: string;
  isbn13: string;
  description?: string;
  pageCount: number;
  rating: number;
  reviewCount: number;
  language: string;
  googleBookId: string;
  [key: string]: any;
}

export interface FetchedMetadata {
  bookId: number | null;
  googleBookId: string | null;
  amazonBookId: string | null;
  title: string | null;
  subtitle?: string | null;
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  isbn13: string | null;
  isbn10: string | null;
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

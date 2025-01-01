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
  authors: Author[];
  categories: Category[];
  publisher: string;
  publishedDate: string;
  isbn10: string;
  description: string;
  pageCount: number;
  language: string;
  googleBookId: string;
  [key: string]: any;
}

export interface FetchedMetadata {
  title: string;
  subtitle?: string;
  authors: Author[];
  categories: Category[];
  publisher: string;
  publishedDate: string;
  isbn10: string;
  description: string;
  pageCount: number;
  language: string;
  googleBookId: string;
  thumbnail: string;
  [key: string]: any;
}

export interface UpdateMedata {
  title?: string;
  subtitle?: string;
  authors?: Author[];
  categories?: Category[];
  publisher?: string;
  publishedDate?: string;
  isbn10?: string;
  description?: string;
  pageCount?: number;
  language?: string;
  googleBookId?: string;
  thumbnail?: string;
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

export interface BookUpdateEvent {
  libraryId: number;
  filename: string;
  book: {
    id: number;
    libraryId: number;
    fileName: string;
    addedOn: string;
    metadata: BookMetadata;
  };
  parsingStatus: string;
}

export interface BookSetting {
  pageNumber: number;
  zoom: number | string;
  sidebar_visible: boolean;
  spread: 'off' | 'even' | 'odd';
}


export interface Book {
  id: number;
  libraryId: number;
  metadata: BookMetadata;
  shelves?: Shelf[];
}

export interface BookMetadata {
  thumbnail: string;
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
}

export interface Author {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Shelf {
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


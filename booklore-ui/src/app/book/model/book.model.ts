export interface Book {
  id: number;
  libraryId: number;
  metadata: BookMetadata
}

export interface PaginatedBooksResponse {
  content: Book[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface BookMetadata {
  thumbnail: string;
  title: string;
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



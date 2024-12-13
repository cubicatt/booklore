import {Author} from './author.model';

export interface Book {
  id: number;
  libraryId: number;
  title: string;
  authors: Author[];
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

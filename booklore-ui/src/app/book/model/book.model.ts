import {Author} from './author.model';

export interface Book {
  id: number;
  libraryId: number;
  title: string;
  authors: Author[];
  viewerSetting: BookViewerSetting;
}

export interface BookViewerSetting {
  pageNumber: number;
  zoom: number | string;
  sidebar_visible: boolean;
  spread: 'off' | 'even' | 'odd';
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

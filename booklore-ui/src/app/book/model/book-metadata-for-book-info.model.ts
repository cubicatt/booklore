export interface BookMetadataBI {
  bookId: number;
  title: string;
  subtitle?: string;
  authors: Array<string>;
  categories: Array<string>;
  publisher: string;
  publishedDate: string;
  isbn10: string;
  isbn13: string;
  asin?: string;
  description?: string;
  pageCount?: number | null;
  language: string;
  googleBookId?: string;
  thumbnailUrl?: string;
}

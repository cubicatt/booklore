export interface BookMetadataBI {
  bookId: number;
  title: string;
  subtitle?: string;
  authors: string[];
  categories: string[];
  publisher: string;
  publishedDate: string;
  isbn10: string;
  isbn13: string;
  rating?:  number | null;
  reviewCount?:  number | null;
  description?: string;
  pageCount?: number | null;
  language: string;
  googleBookId?: string;
  thumbnailUrl?: string;
}

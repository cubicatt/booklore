export interface BookMetadataForm {
  title: string;
  subtitle?: string;
  authors: Array<string>;
  categories: Array<string>;
  publisher: string;
  publishedDate: string;
  isbn10: string;
  isbn13: string;
  asin: string;
  description?: string;
  pageCount: number;
  language: string;
  googleBookId: string;
}

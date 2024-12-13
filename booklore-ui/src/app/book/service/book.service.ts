import { Observable } from 'rxjs';
import { Book, PaginatedBooksResponse } from '../model/book.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly pageSize = 25;
  private readonly libraryUrl = 'http://localhost:8080/v1/library';
  private readonly bookUrl = 'http://localhost:8080/v1/book';

  constructor(private http: HttpClient) {}

  getBook(bookId: number): Observable<Book> {
    return this.http.get<Book>(`${this.bookUrl}/${bookId}`);
  }

  loadBooks(libraryId: number, page: number): Observable<PaginatedBooksResponse> {
    return this.http.get<PaginatedBooksResponse>(
      `${this.libraryUrl}/${libraryId}/book?page=${page}&size=${this.pageSize}`
    );
  }

  searchBooks(query: string): Observable<Book[]> {
    if (query.length < 3) {
      return new Observable<Book[]>();
    }
    return this.http.get<Book[]>(`${this.bookUrl}/search?title=${encodeURIComponent(query)}`);
  }

  updateViewerSetting(viewerSetting: any, bookId: number): Observable<void> {
    const url = `${this.bookUrl}/${bookId}/viewer-setting`;
    return this.http.put<void>(url, viewerSetting);
  }

  getBookDataUrl(bookId: number): string {
    return `${this.bookUrl}/${bookId}/data`;
  }

  getBookCoverUrl(bookId: number): string {
    return `${this.bookUrl}/${bookId}/cover`;
  }
}

import {Observable} from 'rxjs';
import {Book, BookMetadata, BookSetting, BookWithNeighborsDTO, PaginatedBooksResponse} from '../model/book.model';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly pageSize = 25;
  private readonly libraryUrl = 'http://localhost:8080/v1/library';
  private readonly bookUrl = 'http://localhost:8080/v1/book';

  constructor(private http: HttpClient) {
  }

  getBook(bookId: number): Observable<Book> {
    return this.http.get<Book>(`${this.bookUrl}/${bookId}`);
  }

  getBookWithNeighbours(libraryId: number, bookId: number): Observable<BookWithNeighborsDTO> {
    return this.http.get<BookWithNeighborsDTO>(`${this.libraryUrl}/${libraryId}/book/${bookId}/withNeighbors`);
  }

  loadBooks(libraryId: number, page: number): Observable<PaginatedBooksResponse> {
    return this.http.get<PaginatedBooksResponse>(
      `${this.libraryUrl}/${libraryId}/book?page=${page}&size=${this.pageSize}`
    );
  }

  loadLatestBooks(page: number): Observable<PaginatedBooksResponse> {
    return this.http.get<PaginatedBooksResponse>(
      `${this.bookUrl}?page=${page}&size=10&sortBy=lastReadTime&sortDir=desc`
    );
  }

  loadLatestAddedBooks(page: number): Observable<PaginatedBooksResponse> {
    return this.http.get<PaginatedBooksResponse>(
      `${this.bookUrl}?page=${page}&size=10&sortBy=addedOn&sortDir=desc`
    );
  }

  searchBooks(query: string): Observable<Book[]> {
    if (query.length < 2) {
      return new Observable<Book[]>();
    }
    return this.http.get<Book[]>(`${this.bookUrl}/search?title=${encodeURIComponent(query)}`);
  }

  updateViewerSetting(viewerSetting: any, bookId: number): Observable<void> {
    const url = `${this.bookUrl}/${bookId}/viewer-setting`;
    return this.http.put<void>(url, viewerSetting);
  }

  getBookSetting(bookId: number): Observable<BookSetting> {
    return this.http.get<BookSetting>(`${this.bookUrl}/${bookId}/viewer-setting`);
  }

  getBookDataUrl(bookId: number): string {
    return `${this.bookUrl}/${bookId}/data`;
  }

  getBookCoverUrl(bookId: number): string {
    return `${this.bookUrl}/${bookId}/cover`;
  }

  updateLastReadTime(bookId: number): Observable<void> {
    return this.http.put<void>(`${this.bookUrl}/${bookId}/update-last-read`, {});
  }

  fetchBookMetadataByBookId(bookId: number): Observable<BookMetadata[]> {
    return this.http.get<BookMetadata[]>(`${this.bookUrl}/${bookId}/fetch-metadata`);
  }

  fetchBookMetadataByTerm(term: string): Observable<BookMetadata[]> {
    return this.http.get<BookMetadata[]>(`${this.bookUrl}/fetch-metadata?term=${term}`);
  }

  setBookMetadata(googleBookId: string, bookId: number): Observable<void> {
    const requestBody = {googleBookId: googleBookId};
    return this.http.put<void>(`${this.bookUrl}/${bookId}/set-metadata`, requestBody);
  }
}

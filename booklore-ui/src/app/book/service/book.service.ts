import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {catchError, map, switchMap} from 'rxjs/operators';
import {Book, BookMetadata, BookSetting} from '../model/book.model';

@Injectable({
  providedIn: 'root'
})
export class BookService {

  private readonly url = 'http://localhost:8080/v1/book';
  private books = new BehaviorSubject<Book[]>([]);
  books$ = this.books.asObservable();

  constructor(private http: HttpClient) {
    this.http.get<Book[]>(this.url).pipe(
      catchError(error => {
        console.error('Error loading books:', error);
        return of([]);
      })
    ).subscribe((libraries) => {
      this.books.next(libraries);
    });
  }

  assignShelvesToBook(bookIds: Set<number | undefined>, shelvesToAssign: Set<number | undefined>, shelvesToUnassign: Set<number | undefined>): Observable<Book[]> {
    const requestPayload = {
      bookIds: Array.from(bookIds),
      shelvesToAssign: Array.from(shelvesToAssign),
      shelvesToUnassign: Array.from(shelvesToUnassign),
    };
    return this.http.post<Book[]>(`${this.url}/assign-shelves`, requestPayload).pipe(
      map((updatedBooks) => {
        const currentBooks = this.books.value;
        updatedBooks.forEach(updatedBook => {
          const bookIndex = currentBooks.findIndex(b => b.id === updatedBook.id);
          if (bookIndex !== -1) {
            currentBooks[bookIndex] = updatedBook;
          }
        });
        this.books.next([...currentBooks]);
        return updatedBooks;
      }),
      catchError(error => {
        console.error('Error assigning shelves to books:', error);
        throw error;
      })
    );
  }

  removeBooksByLibraryId(libraryId: number): void {
    const filteredBooks = this.books.value.filter(book => book.libraryId !== libraryId);
    this.books.next(filteredBooks);
  }

  getBookById(bookId: number): Observable<Book | undefined> {
    return this.books$.pipe(
      map(books => books.find(book => book.id === bookId))
    );
  }

  getBookSetting(bookId: number): Observable<BookSetting> {
    return this.http.get<BookSetting>(`${this.url}/${bookId}/viewer-setting`);
  }

  updateViewerSetting(viewerSetting: any, bookId: number): Observable<void> {
    const url = `${this.url}/${bookId}/viewer-setting`;
    return this.http.put<void>(url, viewerSetting);
  }

  updateLastReadTime(bookId: number): Observable<Book> {
    return this.http.put<Book>(`${this.url}/${bookId}/update-last-read`, {}).pipe(
      switchMap(updatedBook => {
        console.log(updatedBook);
        const currentBooks = this.books.getValue();
        const updatedBooks = currentBooks.map(book =>
          book.id === updatedBook.id ? { ...book, lastReadTime: updatedBook.lastReadTime } : book
        );
        this.books.next(updatedBooks);
        return [updatedBook];
      })
    );
  }

  readBook(book: Book): void {
    const url = `/pdf-viewer/book/${book.id}`;
    window.open(url, '_blank');
    this.updateLastReadTime(book.id).subscribe({
      complete: () => {
      },
      error: (err) => console.error('Failed to update last read time', err),
    });
  }

  searchBooks(query: string): Observable<Book[]> {
    if (query.length < 2) {
      return of([]);
    }
    return this.http.get<Book[]>(`${this.url}/search?title=${encodeURIComponent(query)}`);
  }

  getBookDataUrl(bookId: number): string {
    return `${this.url}/${bookId}/data`;
  }

  getBookCoverUrl(bookId: number): string {
    return `${this.url}/${bookId}/cover`;
  }

  fetchBookMetadataByBookId(bookId: number): Observable<BookMetadata[]> {
    return this.http.get<BookMetadata[]>(`${this.url}/${bookId}/fetch-metadata`);
  }

  fetchBookMetadataByTerm(term: string): Observable<BookMetadata[]> {
    return this.http.get<BookMetadata[]>(`${this.url}/fetch-metadata?term=${term}`);
  }

  setBookMetadata(googleBookId: string, bookId: number): Observable<void> {
    const requestBody = {googleBookId: googleBookId};
    return this.http.put<void>(`${this.url}/${bookId}/set-metadata`, requestBody);
  }

  handleNewlyCreatedBook(book: Book): void {
    const currentBooks = this.books.getValue();
    const bookIndex = currentBooks.findIndex(existingBook => existingBook.id === book.id);
    const updatedBooks = [...currentBooks];
    if (bookIndex > -1) {
      updatedBooks[bookIndex] = book;
    } else {
      updatedBooks.push(book);
    }
    this.books.next(updatedBooks);
  }

}

import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {Book, BookMetadata, BookSetting} from '../model/book.model';
import {BookState} from '../model/state/book-state.model';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly url = 'http://localhost:8080/v1/book';

  private bookStateSubject = new BehaviorSubject<BookState>({
    books: null,
    loaded: false,
    error: null,
  });
  bookState$ = this.bookStateSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadBooks();
  }

  private loadBooks(): void {
    this.http.get<Book[]>(this.url).pipe(
      tap(books => {
        this.bookStateSubject.next({
          books: books || [],
          loaded: true,
          error: null,
        });
      }),
      catchError(error => {
        this.bookStateSubject.next({
          books: null,
          loaded: true,
          error: error.message,
        });
        return of(null);
      })
    ).subscribe();
  }

  updateBookShelves(bookIds: Set<number | undefined>, shelvesToAssign: Set<number | undefined>, shelvesToUnassign: Set<number | undefined>): Observable<Book[]> {
    const requestPayload = {
      bookIds: Array.from(bookIds),
      shelvesToAssign: Array.from(shelvesToAssign),
      shelvesToUnassign: Array.from(shelvesToUnassign),
    };
    return this.http.post<Book[]>(`${this.url}/assign-shelves`, requestPayload).pipe(
      map(updatedBooks => {
        const currentState = this.bookStateSubject.value;
        const currentBooks = currentState.books || [];
        updatedBooks.forEach(updatedBook => {
          const index = currentBooks.findIndex(b => b.id === updatedBook.id);
          if (index !== -1) {
            currentBooks[index] = updatedBook;
          }
        });
        this.bookStateSubject.next({...currentState, books: [...currentBooks]});
        return updatedBooks;
      }),
      catchError(error => {
        const currentState = this.bookStateSubject.value;
        this.bookStateSubject.next({...currentState, error: error.message});
        throw error;
      })
    );
  }

  removeBooksByLibraryId(libraryId: number): void {
    const currentState = this.bookStateSubject.value;
    const currentBooks = currentState.books || [];
    const filteredBooks = currentBooks.filter(book => book.libraryId !== libraryId);
    this.bookStateSubject.next({...currentState, books: filteredBooks});
  }

  removeBooksFromShelf(shelfId: number): void {
    const currentState = this.bookStateSubject.value;
    const currentBooks = currentState.books || [];
    const updatedBooks = currentBooks.map(book => ({
      ...book,
      shelves: book.shelves?.filter(shelf => shelf.id !== shelfId),
    }));
    this.bookStateSubject.next({...currentState, books: updatedBooks});
  }

  getBookById(bookId: number): Observable<Book | undefined> {
    return this.bookState$.pipe(
      map(state => state.books?.find(book => book.id === bookId))
    );
  }

  getBookSetting(bookId: number): Observable<BookSetting> {
    return this.http.get<BookSetting>(`${this.url}/${bookId}/viewer-setting`);
  }

  updateViewerSetting(viewerSetting: any, bookId: number): Observable<void> {
    return this.http.put<void>(`${this.url}/${bookId}/viewer-setting`, viewerSetting);
  }

  updateLastReadTime(bookId: number): Observable<Book> {
    return this.http.put<Book>(`${this.url}/${bookId}/update-last-read`, {}).pipe(
      switchMap(updatedBook => {
        const currentState = this.bookStateSubject.value;
        const updatedBooks = (currentState.books || []).map(book =>
          book.id === updatedBook.id ? {...book, lastReadTime: updatedBook.lastReadTime} : book
        );
        this.bookStateSubject.next({...currentState, books: updatedBooks});
        return [updatedBook];
      })
    );
  }

  readBook(bookId: number): void {
    const url = `/pdf-viewer/book/${bookId}`;
    window.open(url, '_blank');
    this.updateLastReadTime(bookId).subscribe({
      error: err => console.error('Failed to update last read time', err),
    });
  }

  searchBooks(query: string): Observable<Book[]> {
    if (query.length < 2) {
      return of([]);
    }
    return this.bookState$.pipe(
      map(state =>
        (state.books || []).filter(book =>
          book.metadata?.title?.toLowerCase().includes(query.toLowerCase())
        )
      )
    );
  }

  getBookDataUrl(bookId: number): string {
    return `${this.url}/${bookId}/data`;
  }

  getBookCoverUrl(bookId: number): string {
    return `${this.url}/${bookId}/cover`;
  }

  getBookByIdFromAPI(bookId: number, withDescription: boolean) {
    return this.http.get<Book>(`${this.url}/${bookId}`, {
      params: {
        withDescription: withDescription.toString()
      }
    });
  }


  /*------------------ All the websocket handlers go below ------------------*/

  handleNewlyCreatedBook(book: Book): void {
    const currentState = this.bookStateSubject.value;
    const updatedBooks = currentState.books ? [...currentState.books] : [];
    const bookIndex = updatedBooks.findIndex(existingBook => existingBook.id === book.id);
    if (bookIndex > -1) {
      updatedBooks[bookIndex] = book;
    } else {
      updatedBooks.push(book);
    }
    this.bookStateSubject.next({...currentState, books: updatedBooks});
  }

  handleRemovedBookIds(removedBookIds: Set<number>): void {
    const currentState = this.bookStateSubject.value;
    const filteredBooks = (currentState.books || []).filter(book => !removedBookIds.has(book.id));
    this.bookStateSubject.next({...currentState, books: filteredBooks});
  }

  handleBookUpdate(updatedBook: Book) {
    const currentState = this.bookStateSubject.value;
    const updatedBooks = (currentState.books || []).map(book => {
      return book.id == updatedBook.id ? {...book, metadata: updatedBook.metadata} : book
    });
    this.bookStateSubject.next({...currentState, books: updatedBooks})
  }

  handleBookMetadataUpdate(bookId: number, updatedMetadata: BookMetadata) {
    const currentState = this.bookStateSubject.value;
    const updatedBooks = (currentState.books || []).map(book => {
      return book.id == bookId ? {...book, metadata: updatedMetadata} : book
    });
    this.bookStateSubject.next({...currentState, books: updatedBooks})
  }
}

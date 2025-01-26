import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {catchError, distinctUntilChanged, map, tap} from 'rxjs/operators';
import {Author, Book, BookMetadata, BookSetting, Category} from '../model/book.model';
import {BookState} from '../model/state/book-state.model';
import {API_CONFIG} from '../../config/api-config';

@Injectable({
  providedIn: 'root',
})
export class BookService {

  private readonly url = `${API_CONFIG.BASE_URL}/api/v1/book`;

  private bookStateSubject = new BehaviorSubject<BookState>({
    books: null,
    loaded: false,
    error: null,
  });
  bookState$ = this.bookStateSubject.asObservable();


  private http = inject(HttpClient);

  loadBooks(): void {
    const currentState = this.bookStateSubject.value;
    if (currentState.loaded) {
      return;
    }
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

  getBookSetting(bookId: number): Observable<BookSetting> {
    return this.http.get<BookSetting>(`${this.url}/${bookId}/book-viewer-setting`);
  }

  updateViewerSetting(bookSetting: BookSetting, bookId: number): Observable<void> {
    return this.http.put<void>(`${this.url}/${bookId}/book-viewer-setting`, bookSetting);
  }

  updateLastReadTime(bookId: number) {
    const timestamp = new Date().toISOString();
    const currentState = this.bookStateSubject.value;
    const updatedBooks = (currentState.books || []).map(book =>
      book.id === bookId ? {...book, lastReadTime: timestamp} : book
    );
    this.bookStateSubject.next({...currentState, books: updatedBooks});
  }

  readBook(bookId: number): void {
    const currentBooks = this.bookStateSubject.value.books;
    const book = currentBooks?.find(book => book.id === bookId);
    if (book) {
      if (book.bookType === "PDF") {
        const url = `/pdf-viewer/book/${book.id}`;
        window.open(url, '_blank');
        this.updateLastReadTime(book.id);
      } else if (book.bookType === "EPUB") {
        const url = `/epub-viewer/book/${book.id}`;
        window.open(url, '_blank');
        this.updateLastReadTime(book.id);
      } else {
        console.error('Unsupported book type:', book.bookType);
      }
    } else {
      console.error('Book not found');
    }
  }

  searchBooks(query: string): Book[] {
    if (query.length < 2) {
      return [];
    }
    const state = this.bookStateSubject.value;
    return (state.books || []).filter(book =>
      book.metadata?.title?.toLowerCase().includes(query.toLowerCase()) ||
      book.metadata?.authors.some(author => author.name.toLowerCase().includes(query.toLowerCase()))
    );
  }

  getPdfData(bookId: number): Observable<Blob> {
    return this.http.get<Blob>(`${this.url}/${bookId}/data`, {responseType: 'blob' as 'json'});
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

  savePdfProgress(bookId: number, progress: number): Observable<void> {
    return this.http.post<void>(`${this.url}/progress`, {bookId: bookId, pdfProgress: progress});
  }

  saveEpubProgress(bookId: number, progress: string): Observable<void> {
    return this.http.post<void>(`${this.url}/progress`, {bookId: bookId, epubProgress: progress});
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

  handleRemovedBookIds(removedBookIds: number[]): void {
    const currentState = this.bookStateSubject.value;
    const filteredBooks = (currentState.books || []).filter(book => !removedBookIds.includes(book.id)); // Check using includes() method
    this.bookStateSubject.next({...currentState, books: filteredBooks});
  }

  handleBookUpdate(updatedBook: Book) {
    const currentState = this.bookStateSubject.value;
    const updatedBooks = (currentState.books || []).map(book => {
      return book.id == updatedBook.id ? {...book, metadata: updatedBook.metadata} : book
    });
    this.bookStateSubject.next({...currentState, books: updatedBooks});
  }

  handleBookMetadataUpdate(bookId: number, updatedMetadata: BookMetadata) {
    const currentState = this.bookStateSubject.value;
    const updatedBooks = (currentState.books || []).map(book => {
      return book.id == bookId ? {...book, metadata: updatedMetadata} : book
    });
    this.bookStateSubject.next({...currentState, books: updatedBooks})
  }

  getBookMetadata(bookId: number): BookMetadata | null {
    const book = this.bookStateSubject.value.books?.find(book => book.id === bookId);
    return book?.metadata ?? null;
  }

  updateLock(bookId: number, field: string, isLocked: boolean): void {
    const currentState = this.bookStateSubject.value;
    const updatedBooks = (currentState.books || []).map(book => {
      if (book.id === bookId && book.metadata) {
        return {
          ...book,
          metadata: {
            ...book.metadata,
            [`${field}Locked`]: isLocked
          }
        };
      }
      return book;
    });
    this.bookStateSubject.next({...currentState, books: updatedBooks});
  }
}

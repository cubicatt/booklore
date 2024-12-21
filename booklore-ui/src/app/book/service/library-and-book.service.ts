import {Observable, of} from 'rxjs';
import {Book, BookMetadata, BookSetting, BookWithNeighborsDTO, Shelf} from '../model/book.model';
import {computed, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, map, tap} from 'rxjs/operators';
import {Library, LibraryApiResponse} from '../model/library.model';

@Injectable({
  providedIn: 'root',
})
export class LibraryAndBookService {
  private readonly libraryUrl = 'http://localhost:8080/v1/library';
  private readonly bookUrl = 'http://localhost:8080/v1/book';
  private readonly shelfUrl = 'http://localhost:8080/v1/shelf';

  #libraries = signal<Library[]>([]);
  libraries = computed(this.#libraries);

  #shelves = signal<Shelf[]>([]);
  shelves = computed(this.#shelves);

  #lastReadBooks = signal<Book[]>([]);
  lastReadBooks = computed(this.#lastReadBooks);
  lastReadBooksLoaded: boolean = false;

  #latestAddedBooks = signal<Book[]>([]);
  latestAddedBooks = computed(this.#latestAddedBooks);
  latestAddedBooksLoaded: boolean = false;

  private libraryBooksMap = signal<Map<number, Book[]>>(new Map());
  private loadedLibraries = new Set<number>();


  constructor(private http: HttpClient) {
  }


  /*---------- Shelf Methods go below ----------*/

  initializeShelves(): void {
    this.http.get<Shelf[]>(this.shelfUrl).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error loading shelves:', error);
        return of([]);
      })
    ).subscribe(
      (shelves) => {
        this.#shelves.set(shelves);
        console.log("Shelves Initialized")
      }
    );
  }

  createShelf(name: string): Observable<Shelf> {
    const newShelf: Shelf = {name};
    return this.http.post<Shelf>(this.shelfUrl, newShelf).pipe(
      tap((createdShelf) => {
        this.#shelves.set([...this.#shelves(), createdShelf]);
        console.log("New Shelf Created", createdShelf);
      }),
      catchError((error) => {
        console.error('Error creating shelf:', error);
        throw error;
      })
    );
  }

  assignShelvesToBook(book: Book, shelfIds: number[]): Observable<Book> {
    const requestPayload = {
      bookId: book.id,
      shelfIds: shelfIds
    };
    return this.http.post<Book>(`${this.shelfUrl}/assign-shelves`, requestPayload).pipe(
      tap((updatedBook) => {
        const bookLibraryId = book.libraryId;
        const updatedMap = new Map(this.libraryBooksMap());
        const libraryBooks = updatedMap.get(bookLibraryId) || [];
        const updatedLibraryBooks = libraryBooks.map(b =>
          b.id === book.id ? { ...b, shelves: updatedBook.shelves } : b
        );
        updatedMap.set(bookLibraryId, updatedLibraryBooks);
        this.libraryBooksMap.set(updatedMap);
      }),
      catchError((error) => {
        console.error('Error assigning shelves to book:', error);
        throw error;
      })
    );
  }


  /*---------- Library Methods go below ----------*/

  initializeLibraries(): void {
    this.http.get<LibraryApiResponse>(this.libraryUrl).pipe(
      map(response => response.content),
      catchError(error => {
        console.error('Error loading libraries:', error);
        return of([]);
      })
    ).subscribe(
      (libraries) => {
        this.#libraries.set(libraries);
        console.log("Library Initialized")
      }
    );
  }

  createLibrary(newLibrary: Library): Observable<Library> {
    return this.http.post<Library>(this.libraryUrl, newLibrary).pipe(
      tap((createdLibrary) => {
        const currentLibraries = this.#libraries();
        this.#libraries.set([...currentLibraries, createdLibrary]);
        console.log("New Library Created");
      }),
      catchError((error) => {
        console.error('Error creating library:', error);
        throw error;
      })
    );
  }

  deleteLibrary(libraryId: number | null): Observable<void> {
    return this.http.delete<void>(`${this.libraryUrl}/${libraryId}`).pipe(
      tap(() => {
        const currentLibraries = this.#libraries();
        this.#libraries.set(currentLibraries.filter(library => library.id !== libraryId));

        const updatedLastReadBooks = this.#lastReadBooks().filter(book => book.libraryId !== libraryId);
        this.#lastReadBooks.set(updatedLastReadBooks);

        const updatedLatestAddedBooks = this.#latestAddedBooks().filter(book => book.libraryId !== libraryId);
        this.#latestAddedBooks.set(updatedLatestAddedBooks);

        const updatedMap = new Map(this.libraryBooksMap());
        updatedMap.delete(libraryId as number);
        this.libraryBooksMap.set(updatedMap);

        console.log(`Library ${libraryId} and associated books removed successfully.`);
      }),
      catchError((error) => {
        console.error('Error deleting library:', error);
        throw error;
      })
    );
  }


  /*---------- Book Methods go below ----------*/

  readBook(book: Book): void {
    const url = `/pdf-viewer/book/${book.id}`;
    window.open(url, '_blank');
    this.addToLastReadBooks(book);
    this.updateLastReadTime(book.id).subscribe({
      complete: () => {
      },
      error: (err) => console.error('Failed to update last read time', err),
    });
  }

  addToLastReadBooks(book: Book): void {
    this.#lastReadBooks.set([book, ...this.#lastReadBooks()
      .filter(b => b.id !== book.id)]
      .slice(0, 25));
  }

  addToLatestAddedBooks(book: Book): void {
    const updatedBooks = [book, ...this.#latestAddedBooks()];
    this.#latestAddedBooks.set(updatedBooks.slice(0, 25));
  }

  getLibraryBooks(libraryId: number) {
    return computed(() => this.libraryBooksMap().get(libraryId) || []);
  }

  loadBooksSignal(libraryId: number) {
    if (!this.loadedLibraries.has(libraryId)) {
      this.http.get<Book[]>(`${this.libraryUrl}/${libraryId}/book`).pipe(
        map(response => response),
        catchError(error => {
          console.error(`Error loading books for library ${libraryId}:`, error);
          return of([]);
        })
      ).subscribe((books) => {
        const updatedMap = new Map(this.libraryBooksMap());
        updatedMap.set(libraryId, books);
        this.libraryBooksMap.set(updatedMap);
        this.loadedLibraries.add(libraryId);
        console.log(`Loaded books for library ${libraryId}`);
      });
    }
  }

  handleNewBook(book: Book) {
    const newBook: Book = this.convertBookDTOToBook(book);
    const updatedMap = new Map(this.libraryBooksMap());
    const currentBooks = updatedMap.get(newBook.libraryId) || [];
    updatedMap.set(newBook.libraryId, [newBook, ...currentBooks]);
    this.libraryBooksMap.set(updatedMap);
    this.addToLatestAddedBooks(book);
  }

  private convertBookDTOToBook(book: Book): Book {
    return {
      id: book.id,
      libraryId: book.libraryId,
      metadata: {
        thumbnail: book.metadata.thumbnail,
        title: book.metadata.title,
        subtitle: book.metadata.subtitle,
        authors: book.metadata.authors,
        categories: book.metadata.categories,
        publisher: book.metadata.publisher,
        publishedDate: book.metadata.publishedDate,
        isbn10: book.metadata.isbn10,
        description: book.metadata.description,
        pageCount: book.metadata.pageCount,
        language: book.metadata.language,
        googleBookId: book.metadata.googleBookId,
      }
    };
  }

  getBook(bookId: number): Observable<Book> {
    return this.http.get<Book>(`${this.bookUrl}/${bookId}`);
  }

  getBookWithNeighbours(libraryId: number, bookId: number): Observable<BookWithNeighborsDTO> {
    return this.http.get<BookWithNeighborsDTO>(`${this.libraryUrl}/${libraryId}/book/${bookId}/withNeighbors`);
  }

  getLastReadBooks() {
    this.http.get<Book[]>(`${this.bookUrl}?sortBy=lastReadTime&sortDir=desc`).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error loading last read books:', error);
        return of([]);
      })
    ).subscribe(
      (books) => {
        this.#lastReadBooks.set([...this.#lastReadBooks(), ...books]);
        this.lastReadBooksLoaded = true;
        console.log("Loaded last read books")
      }
    );
  }

  getLatestAddedBooks() {
    this.http.get<Book[]>(`${this.bookUrl}?sortBy=addedOn&sortDir=desc`).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error loading latest added books:', error);
        return of([]);
      })
    ).subscribe(
      (books) => {
        this.#latestAddedBooks.set([...this.#latestAddedBooks(), ...books]);
        this.latestAddedBooksLoaded = true;
        console.log("Loaded latest added books")
      }
    );
  }

  searchBooks(query: string): Observable<Book[]> {
    if (query.length < 2) {
      return of([]);
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

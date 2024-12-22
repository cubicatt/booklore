import {computed, Injectable, signal} from '@angular/core';
import {Library, LibraryApiResponse} from '../model/library.model';
import {Book, BookMetadata, BookSetting, BookWithNeighborsDTO, Shelf} from '../model/book.model';
import {HttpClient} from '@angular/common/http';
import {Observable, of, tap} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class LibraryAndBookService {

    private readonly libraryUrl = 'http://localhost:8080/v1/library';
    private readonly bookUrl = 'http://localhost:8080/v1/book';
    private readonly shelfUrl = 'http://localhost:8080/v1/shelf';

    #appState = signal<{
        libraries: Library[];
        shelves: Shelf[];
        books: Book[];
        lastReadBooks: Set<number> | null;
        latestAddedBooks: Set<number> | null;
        libraryBooksMap: Map<number, Set<number>>;
        shelfBooksMap: Map<number, Set<number>>;
    }>({
        libraries: [],
        shelves: [],
        books: [],
        lastReadBooks: new Set(),
        latestAddedBooks: new Set(),
        libraryBooksMap: new Map(),
        shelfBooksMap: new Map(),
    });

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
                this.#appState.set({
                    ...this.#appState(),
                    shelves: shelves,
                });
                console.log("Shelves Initialized");
            }
        );
    }

    getShelves() {
        return computed(() => this.#appState().shelves);
    }

    createShelf(name: string): Observable<Shelf> {
        return this.http.post<Shelf>(this.shelfUrl, {name}).pipe(
            map(newShelf => {
                const updatedShelfBooksMap = new Map(this.#appState().shelfBooksMap);
                updatedShelfBooksMap.set(newShelf.id!, new Set());
                const updatedState = {
                    ...this.#appState(),
                    shelves: [...this.#appState().shelves, newShelf],
                    shelfBooksMap: updatedShelfBooksMap
                };
                this.#appState.set(updatedState);
                return newShelf;
            }),
            catchError(error => {
                console.error('Error creating shelf:', error);
                throw error;
            })
        );
    }

    getShelfBooks(shelfId: number) {
        // Check if shelfBooksMap does not contain the shelfId (books not loaded yet)
        if (!this.#appState().shelfBooksMap.has(shelfId)) {
            // Fetch the books for the shelf from the backend
            this.http.get<Book[]>(`${this.shelfUrl}/${shelfId}/books`).pipe(
                map((fetchedBooks) => {
                    // Filter out books that are already in the books state to avoid duplicates
                    const newBooks = fetchedBooks.filter(fetchedBook =>
                        !this.#appState().books.some(existingBook => existingBook.id === fetchedBook.id)
                    );

                    // If there are any new books, add them to the books state
                    if (newBooks.length > 0) {
                        this.#appState.set({
                            ...this.#appState(),
                            books: [...this.#appState().books, ...newBooks],
                        });
                    }

                    // Update shelfBooksMap with the shelfId and the new books as a Set (not an array)
                    const updatedShelfBooksMap = new Map(this.#appState().shelfBooksMap);
                    updatedShelfBooksMap.set(shelfId, new Set(fetchedBooks.map(book => book.id)));

                    // Update the app state with the new shelfBooksMap
                    this.#appState.set({
                        ...this.#appState(),
                        shelfBooksMap: updatedShelfBooksMap,
                    });
                }),
                catchError((error) => {
                    console.error('Error loading books for shelf:', error);
                    return of([]);  // Return an empty array in case of error
                })
            ).subscribe();
        }

        // Return a computed signal of books for the specified shelf
        return computed(() => {
            const bookIdsForShelf = this.#appState().shelfBooksMap.get(shelfId) || new Set<number>();
            return this.#appState().books.filter(book => bookIdsForShelf.has(book.id));
        });
    }

    deleteShelf(shelfId: number): Observable<void> {
        return this.http.delete<void>(`${this.shelfUrl}/${shelfId}`).pipe(
            tap(() => {
                const state = this.#appState();

                // Update books by removing any references to the deleted shelf
                const updatedBooks = state.books.map(book => ({
                    ...book,
                    shelves: book.shelves?.filter(shelf => shelf.id !== shelfId),
                }));

                // Remove the shelf from shelfBooksMap
                const updatedShelfBooksMap = new Map(state.shelfBooksMap);
                updatedShelfBooksMap.delete(shelfId);

                // Remove the shelf from shelves
                const updatedShelves = state.shelves.filter(shelf => shelf.id !== shelfId);

                this.#appState.update((state) => ({
                    ...state,
                    books: updatedBooks,
                    shelfBooksMap: updatedShelfBooksMap,
                    shelves: updatedShelves,
                }));
            }),
            catchError(error => {
                console.error('Error deleting shelf:', error);
                throw error;
            })
        );
    }

    assignShelvesToBook(book: Book, shelfIds: number[]): Observable<Book> {
        const requestPayload = {
            bookId: book.id,
            shelfIds: shelfIds,
        };

        return this.http.post<Book>(`${this.shelfUrl}/assign-shelves`, requestPayload).pipe(
            tap((updatedBook) => {
                const state = this.#appState();

                const books = [...state.books]; // Create a new books array to trigger reactivity

                // Replace book's shelves with updated data
                const matchedBookIndex = books.findIndex(b => b.id === updatedBook.id);
                if (matchedBookIndex !== -1) {
                    books[matchedBookIndex] = {
                        ...books[matchedBookIndex],
                        shelves: updatedBook.shelves || [],
                    };
                }

                const shelfBooksMap = new Map(state.shelfBooksMap);

                // Remove the book from all existing/previous shelves in the map
                shelfBooksMap.forEach((bookSet, shelfId) => {
                    bookSet.delete(updatedBook.id);
                    if (bookSet.size === 0) {
                        shelfBooksMap.delete(shelfId); // Delete empty shelves
                    }
                });

                // Add the book to the updated shelves in the map
                updatedBook.shelves?.forEach((shelf) => {
                    if (shelf.id !== undefined) {
                        if (!shelfBooksMap.has(shelf.id)) {
                            shelfBooksMap.set(shelf.id, new Set());
                        }
                        shelfBooksMap.get(shelf.id)!.add(updatedBook.id);
                    }
                });

                this.#appState.update((state) => ({
                    ...state,
                    books,
                    shelfBooksMap,
                }));
            }),
            catchError(error => {
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
                this.#appState.set({
                    ...this.#appState(),
                    libraries: libraries,
                });
                console.log("Library Initialized");
            }
        );
    }

    getLibraries() {
        return computed(() => this.#appState().libraries);
    }

    getLibraryBooks(libraryId: number) {
        if (!this.#appState().libraryBooksMap.has(libraryId)) {
            this.http.get<Book[]>(`${this.libraryUrl}/${libraryId}/book`).subscribe({
                next: (books) => {
                    const updatedLibraryBooksMap = new Map(this.#appState().libraryBooksMap);
                    updatedLibraryBooksMap.set(libraryId, new Set(books.map(book => book.id)));
                    const existingBookIds = new Set(this.#appState().books.map(book => book.id));
                    const newBooks = books.filter(book => !existingBookIds.has(book.id));
                    this.#appState.set({
                        ...this.#appState(),
                        libraryBooksMap: updatedLibraryBooksMap,
                        books: [...this.#appState().books, ...newBooks],
                    });
                    console.log(`Loaded books for library ${libraryId}`);
                },
                error: (err) => {
                    console.error(`Failed to load books for library ${libraryId}`, err);
                },
            });
        }
        return computed(() => {
            const bookIds = this.#appState().libraryBooksMap.get(libraryId) || new Set();
            return this.#appState().books.filter(book => bookIds.has(book.id));
        });
    }

    createLibrary(newLibrary: Library): Observable<Library> {
        return this.http.post<Library>(this.libraryUrl, newLibrary).pipe(
            map((createdLibrary) => {
                const updatedLibraries = [...this.#appState().libraries, createdLibrary];
                const updatedLibraryBooksMap = new Map(this.#appState().libraryBooksMap);
                if (createdLibrary.id != null) {
                    updatedLibraryBooksMap.set(createdLibrary.id, new Set());
                }
                this.#appState.set({
                    ...this.#appState(),
                    libraries: updatedLibraries,
                    libraryBooksMap: updatedLibraryBooksMap,
                });
                return createdLibrary;
            }),
            catchError((error) => {
                console.error('Error creating library:', error);
                throw error;
            })
        );
    }

    deleteLibrary(libraryId: number | null): Observable<void> {
        if (libraryId === null) {
            console.error('Library ID is null. Deletion aborted.');
            return of();  // Return an empty observable
        }

        return this.http.delete<void>(`${this.libraryUrl}/${libraryId}`).pipe(
            map(() => {
                // Filter out the library from the list of libraries
                const updatedLibraries = this.#appState().libraries.filter(library => library.id !== libraryId);

                // Update the libraryBooksMap by deleting the library's books
                const updatedLibraryBooksMap = new Map(this.#appState().libraryBooksMap);
                updatedLibraryBooksMap.delete(libraryId);

                // Get books associated with this library and remove them from the books list
                const booksToDelete = this.#appState().libraryBooksMap.get(libraryId) || new Set<number>;
                const updatedBooks = this.#appState().books.filter(book => !booksToDelete.has(book.id));

                // Remove books from lastReadBooks and latestAddedBooks sets
                const updatedLastReadBooks = new Set([...this.#appState().lastReadBooks!].filter(bookId => !booksToDelete.has(bookId)));
                const updatedLatestAddedBooks = new Set([...this.#appState().latestAddedBooks!].filter(bookId => !booksToDelete.has(bookId)));

                // Remove books from shelfBooksMap
                const updatedShelfBooksMap = new Map(this.#appState().shelfBooksMap);
                booksToDelete.forEach(bookId => {
                    updatedShelfBooksMap.forEach((shelfBooks, shelfId) => {
                        shelfBooks.delete(bookId); // Use Set's delete method
                    });
                });

                // Update the app state with the modified collections
                this.#appState.set({
                    ...this.#appState(),
                    libraries: updatedLibraries,
                    libraryBooksMap: updatedLibraryBooksMap,
                    books: updatedBooks,
                    lastReadBooks: updatedLastReadBooks,
                    latestAddedBooks: updatedLatestAddedBooks,
                    shelfBooksMap: updatedShelfBooksMap,
                });

                console.log(`Library with ID ${libraryId} deleted successfully.`);
            }),
            catchError((error) => {
                console.error('Error deleting library:', error);
                return of();  // Return an empty observable in case of error
            })
        );
    }


    /*---------- Book Methods go below ----------*/

    addToLastReadBooks(book: Book): void {
        const currentLastReadBooks = new Set(this.#appState().lastReadBooks!);

        // Step 1: Remove the book if it already exists
        currentLastReadBooks.delete(book.id);

        // Step 2: Add the book to the beginning of the set (Sets don't have a defined order, but we can simulate this by using delete and add)
        currentLastReadBooks.add(book.id);

        // Step 3: Ensure the set only contains the latest 25 books
        // Remove the oldest book if the set exceeds 25 books (note: this simulates the "latest" behavior)
        if (currentLastReadBooks.size > 25) {
            const firstAdded = [...currentLastReadBooks][0];  // Get the first added item (oldest)
            currentLastReadBooks.delete(firstAdded);          // Remove the oldest book
        }

        // Update the app state with the new set of last read books
        this.#appState.set({
            ...this.#appState(),
            lastReadBooks: currentLastReadBooks,
        });

        console.log(`Book added to lastReadBooks: ${book.metadata?.title}`);
    }


    addToLatestAddedBooks(book: Book): void {
        const currentLatestAddedBooks = new Set(this.#appState().latestAddedBooks!);

        // Step 1: Remove the book if it already exists
        currentLatestAddedBooks.delete(book.id);

        // Step 2: Add the book to the set
        currentLatestAddedBooks.add(book.id);

        // Step 3: Ensure the set only contains the latest 25 books
        // Remove the oldest book if the set exceeds 25 books
        if (currentLatestAddedBooks.size > 25) {
            const firstAdded = [...currentLatestAddedBooks][0];  // Get the first added item (oldest)
            currentLatestAddedBooks.delete(firstAdded);          // Remove the oldest book
        }

        // Update the app state with the new set of latest added books
        this.#appState.set({
            ...this.#appState(),
            latestAddedBooks: currentLatestAddedBooks,
        });

        console.log(`Book added to latestAddedBooks: ${book.metadata?.title}`);
    }


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


    getBook(bookId: number): Observable<Book> {
        return this.http.get<Book>(`${this.bookUrl}/${bookId}`);
    }

    getBookWithNeighbours(libraryId: number, bookId: number): Observable<BookWithNeighborsDTO> {
        return this.http.get<BookWithNeighborsDTO>(`${this.libraryUrl}/${libraryId}/book/${bookId}/withNeighbors`);
    }

    getLastReadBooks() {
        // If lastReadBooks is null or empty, it means the books have never been loaded
        if (!this.#appState().lastReadBooks || this.#appState().lastReadBooks!.size === 0) {
            this.http.get<Book[]>(`${this.bookUrl}?sortBy=lastReadTime&sortDir=desc`).pipe(
                map((lastReadBooks) => {
                    // Update lastReadBooks signal with the fetched books' IDs (as a Set)
                    this.#appState.set({
                        ...this.#appState(),
                        lastReadBooks: new Set(lastReadBooks.map(book => book.id)), // Store as Set<number>
                    });

                    // Ensure no duplicate books in the 'books' signal
                    const existingBooks = new Set(this.#appState().books.map(book => book.id));
                    const newBooks = lastReadBooks.filter(book => !existingBooks.has(book.id));

                    // Add the new books to the 'books' signal
                    this.#appState.set({
                        ...this.#appState(),
                        books: [...this.#appState().books, ...newBooks],
                    });

                    // Update latestAddedBooks signal (initialize with the fetched books' IDs if it was never loaded)
                    if (this.#appState().latestAddedBooks!.size === 0) {
                        this.#appState.set({
                            ...this.#appState(),
                            latestAddedBooks: new Set(lastReadBooks.map(book => book.id)), // Initialize as Set<number>
                        });
                    }

                    // Return books as a signal
                    return lastReadBooks;
                }),
                catchError((error) => {
                    console.error('Error loading last read books:', error);
                    return of([]);  // Return an empty array in case of error
                })
            ).subscribe();
        }

        // Return books as a signal from state if already loaded
        return computed(() => {
            const lastReadBooksFromState = this.#appState().lastReadBooks;
            if (lastReadBooksFromState) {
                return this.#appState().books.filter(book => lastReadBooksFromState.has(book.id));
            }
            return [];
        });
    }

    getLatestAddedBooks() {
        // If latestAddedBooks is null or empty, it means they haven't been loaded yet
        if (!this.#appState().latestAddedBooks || this.#appState().latestAddedBooks!.size === 0) {
            this.http.get<Book[]>(`${this.bookUrl}?sortBy=addedOn&sortDir=desc`).pipe(
                map((latestAddedBooks) => {
                    // Update latestAddedBooks signal with the fetched books' IDs (as a Set)
                    this.#appState.set({
                        ...this.#appState(),
                        latestAddedBooks: new Set(latestAddedBooks.map(book => book.id)), // Store as Set<number>
                    });

                    // Ensure no duplicate books in the 'books' signal
                    const existingBooks = new Set(this.#appState().books.map(book => book.id));
                    const newBooks = latestAddedBooks.filter(book => !existingBooks.has(book.id));

                    // Add the new books to the 'books' signal
                    this.#appState.set({
                        ...this.#appState(),
                        books: [...this.#appState().books, ...newBooks],
                    });

                    // Return the latest added books as a signal
                    return latestAddedBooks;
                }),
                catchError((error) => {
                    console.error('Error loading latest added books:', error);
                    return of([]);  // Return an empty array in case of error
                })
            ).subscribe();
        }

        // Return books as a signal from state if already loaded
        return computed(() => {
            const latestAddedBooksFromState = this.#appState().latestAddedBooks;
            if (latestAddedBooksFromState) {
                return this.#appState().books.filter(book => latestAddedBooksFromState.has(book.id));
            }
            return [];
        });
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

    handleNewBook(book: Book): void {
        // Check if the book already exists in the 'books' state
        const existingBooks = new Set(this.#appState().books.map(b => b.id));

        if (!existingBooks.has(book.id)) {
            // If the book is new, add it to the 'books' state
            this.#appState.set({
                ...this.#appState(),
                books: [...this.#appState().books, book],
            });

            // Update the 'libraryBooksMap' to include this new book
            const libraryId = book.libraryId;

            // Retrieve the existing book IDs for the library or create a new Set if it doesn't exist
            const existingLibraryBooks = this.#appState().libraryBooksMap.get(libraryId) || new Set<number>();

            // Add the new book's ID to the library's Set
            existingLibraryBooks.add(book.id);

            // Update the 'libraryBooksMap' in the state
            const updatedLibraryBooksMap = new Map(this.#appState().libraryBooksMap);
            updatedLibraryBooksMap.set(libraryId, existingLibraryBooks);

            this.#appState.set({
                ...this.#appState(),
                libraryBooksMap: updatedLibraryBooksMap,
            });

            this.addToLatestAddedBooks(book);
        } else {
            console.log(`Book with ID ${book.id} already exists in the state.`);
        }
    }

}

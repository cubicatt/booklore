import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {catchError, map} from 'rxjs/operators';
import {Library} from '../model/library.model';
import {BookService} from './book.service';
import {SortOption} from '../model/sort.model';
import {LibraryState} from '../model/state/library-state.model';

@Injectable({
  providedIn: 'root',
})
export class LibraryService {
  private readonly url = 'http://localhost:8080/v1/library';

  private libraryStateSubject = new BehaviorSubject<LibraryState>({
    libraries: null,
    loaded: false,
    error: null,
  });
  libraryState$ = this.libraryStateSubject.asObservable();

  private http = inject(HttpClient);
  private bookService = inject(BookService);

  constructor() {
    this.loadLibraries();
  }

  private loadLibraries(): void {
    this.http.get<Library[]>(this.url).pipe(
      catchError(error => {
        this.libraryStateSubject.next({
          libraries: null,
          loaded: true,
          error: error.message,
        });
        return of([]);
      })
    ).subscribe(libraries => {
      this.libraryStateSubject.next({
        libraries,
        loaded: true,
        error: null,
      });
    });
  }

  createLibrary(newLibrary: Library): Observable<Library> {
    return this.http.post<Library>(this.url, newLibrary).pipe(
      map(createdLibrary => {
        const currentState = this.libraryStateSubject.value;
        const updatedLibraries = currentState.libraries ? [...currentState.libraries, createdLibrary] : [createdLibrary];
        this.libraryStateSubject.next({...currentState, libraries: updatedLibraries});
        return createdLibrary;
      }),
      catchError(error => {
        const currentState = this.libraryStateSubject.value;
        this.libraryStateSubject.next({...currentState, error: error.message});
        throw error;
      })
    );
  }

  deleteLibrary(libraryId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${libraryId}`).pipe(
      tap(() => {
        this.bookService.removeBooksByLibraryId(libraryId);
        const currentState = this.libraryStateSubject.value;
        const updatedLibraries = currentState.libraries?.filter(library => library.id !== libraryId) || [];
        this.libraryStateSubject.next({...currentState, libraries: updatedLibraries});
      }),
      catchError(error => {
        const currentState = this.libraryStateSubject.value;
        this.libraryStateSubject.next({...currentState, error: error.message});
        return of();
      })
    );
  }

  refreshLibrary(libraryId: number): Observable<void> {
    return this.http.put<void>(`${this.url}/${libraryId}/refresh`, {}).pipe(
      catchError(error => {
        const currentState = this.libraryStateSubject.value;
        this.libraryStateSubject.next({...currentState, error: error.message});
        throw error;
      })
    );
  }

  updateSort(libraryId: number, sort: SortOption): Observable<Library> {
    return this.http.put<Library>(`${this.url}/${libraryId}/sort`, sort).pipe(
      map(updatedLibrary => {
        const currentState = this.libraryStateSubject.value;
        const updatedLibraries = currentState.libraries?.map(library =>
          library.id === libraryId ? updatedLibrary : library
        ) || [];
        this.libraryStateSubject.next({...currentState, libraries: updatedLibraries});
        return updatedLibrary;
      }),
      catchError(error => {
        const currentState = this.libraryStateSubject.value;
        this.libraryStateSubject.next({...currentState, error: error.message});
        throw error;
      })
    );
  }

  getBookCount(libraryId: number): Observable<number> {
    return this.bookService.bookState$.pipe(
      map(state => (state.books || []).filter(book => book.libraryId === libraryId).length)
    );
  }
}

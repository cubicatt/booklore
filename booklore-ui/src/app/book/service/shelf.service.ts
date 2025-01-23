import {inject, Injectable} from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Shelf } from '../model/shelf.model';
import { SortOption } from '../model/sort.model';
import { BookService } from './book.service';
import { ShelfState } from '../model/state/shelf-state.model';
import {API_CONFIG} from '../../config/api-config';

@Injectable({
  providedIn: 'root',
})
export class ShelfService {
  private readonly url = `${API_CONFIG.BASE_URL}/api/v1/shelf`;
  private shelfStateSubject = new BehaviorSubject<ShelfState>({
    shelves: null,
    loaded: false,
    error: null,
  });
  shelfState$ = this.shelfStateSubject.asObservable();

  private http = inject(HttpClient);
  private bookService = inject(BookService);

  constructor() {
    this.loadShelves();
  }

  private loadShelves(): void {
    this.http.get<Shelf[]>(this.url).pipe(
      catchError(error => {
        this.shelfStateSubject.next({
          shelves: null,
          loaded: true,
          error: error.message,
        });
        return of([]);
      })
    ).subscribe(shelves => {
      this.shelfStateSubject.next({
        shelves,
        loaded: true,
        error: null,
      });
    });
  }

  createShelf(shelf: Shelf): Observable<Shelf> {
    return this.http.post<Shelf>(this.url, shelf).pipe(
      map(newShelf => {
        const currentState = this.shelfStateSubject.value;
        const updatedShelves = currentState.shelves ? [...currentState.shelves, newShelf] : [newShelf];
        this.shelfStateSubject.next({ ...currentState, shelves: updatedShelves });
        return newShelf;
      }),
      catchError(error => {
        const currentState = this.shelfStateSubject.value;
        this.shelfStateSubject.next({ ...currentState, error: error.message });
        throw error;
      })
    );
  }

  updateSort(shelfId: number, sort: SortOption): Observable<Shelf> {
    return this.http.put<Shelf>(`${this.url}/${shelfId}/sort`, sort).pipe(
      map(updatedShelf => {
        const currentState = this.shelfStateSubject.value;
        const updatedShelves = currentState.shelves?.map(shelf =>
          shelf.id === shelfId ? updatedShelf : shelf
        ) || [];
        this.shelfStateSubject.next({ ...currentState, shelves: updatedShelves });
        return updatedShelf;
      }),
      catchError(error => {
        const currentState = this.shelfStateSubject.value;
        this.shelfStateSubject.next({ ...currentState, error: error.message });
        throw error;
      })
    );
  }

  deleteShelf(shelfId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${shelfId}`).pipe(
      tap(() => {
        this.bookService.removeBooksFromShelf(shelfId);
        const currentState = this.shelfStateSubject.value;
        const updatedShelves = currentState.shelves?.filter(shelf => shelf.id !== shelfId) || [];
        this.shelfStateSubject.next({ ...currentState, shelves: updatedShelves });
      }),
      catchError(error => {
        const currentState = this.shelfStateSubject.value;
        this.shelfStateSubject.next({ ...currentState, error: error.message });
        return of();
      })
    );
  }

  getBookCount(shelfId: number): Observable<number> {
    return this.bookService.bookState$.pipe(
      map(state =>
        (state.books || []).filter(book => book.shelves?.some(shelf => shelf.id === shelfId)).length
      )
    );
  }
}

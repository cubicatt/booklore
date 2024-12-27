import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of, tap} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {Shelf} from '../model/shelf.model';
import {SortOption} from '../model/sort.model';
import {BookService} from "./book.service";

@Injectable({
  providedIn: 'root'
})
export class ShelfService {

  private readonly url = 'http://localhost:8080/v1/shelf';
  private shelves = new BehaviorSubject<Shelf[]>([]);
  shelves$ = this.shelves.asObservable();

  constructor(private http: HttpClient, private bookService: BookService) {
    this.http.get<Shelf[]>(this.url).pipe(
      catchError(error => {
        return of([]);
      })
    ).subscribe((shelves) => {
      this.shelves.next(shelves);
    });
  }

  createShelf(shelf: Shelf): Observable<Shelf> {
    return this.http.post<Shelf>(this.url, shelf).pipe(
      map(newShelf => {
        this.shelves.next([...this.shelves.value, newShelf])
        return newShelf;
      }),
      catchError(error => {
        console.error('Error creating shelf:', error);
        throw error;
      })
    );
  }

  updateSort(shelfId: number, sort: SortOption): Observable<Shelf> {
    return this.http.put<Shelf>(`${this.url}/${shelfId}/sort`, sort).pipe(
      map(updatedShelf => {
        const updatedShelves = this.shelves.value.map(shelf =>
          shelf.id === shelfId ? updatedShelf : shelf
        );
        this.shelves.next(updatedShelves);
        return updatedShelf;
      }),
      catchError(error => {
        console.error('Error updating shelf sort:', error);
        throw error;
      })
    );
  }

  deleteShelf(shelfId: number) {
    return this.http.delete<void>(`${this.url}/${shelfId}`).pipe(
      tap(() => {
        this.bookService.removeBooksByLibraryId(shelfId);
        let shelves = this.shelves.value.filter(shelf => shelf.id !== shelfId);
        this.shelves.next(shelves);
      }),
      catchError(error => {
        return of();
      })
    );
  }

  getBookCount(shelfId: number): Observable<number> {
    return this.bookService.books$.pipe(
      map(books => books.filter(book => book.shelves?.some(shelf => shelf.id === shelfId)).length)
    );
  }
}

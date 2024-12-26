import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {Shelf} from '../model/shelf.model';
import {Sort} from '../model/sort.model';

@Injectable({
  providedIn: 'root'
})
export class ShelfService {

  private readonly url = 'http://localhost:8080/v1/shelf';
  private shelves = new BehaviorSubject<Shelf[]>([]);
  shelves$ = this.shelves.asObservable();

  constructor(private http: HttpClient) {
    this.http.get<Shelf[]>(this.url).pipe(
      catchError(error => {
        return of([]);
      })
    ).subscribe((shelves) => {
      this.shelves.next(shelves);
    });
  }

  createShelf(name: string): Observable<Shelf> {
    return this.http.post<Shelf>(this.url, {name}).pipe(
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

  updateSort(shelfId: number, sort: Sort): Observable<Shelf> {
    return this.http.put<Shelf>(`${this.url}/${shelfId}/sort`, { shelfId, sort }).pipe(
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

}

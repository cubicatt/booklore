import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {Shelf} from '../model/book.model';
import {catchError, map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {Library} from '../model/library.model';

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
}

import {Injectable, OnInit} from '@angular/core';
import {BehaviorSubject, Observable, of, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {catchError, map} from 'rxjs/operators';
import {Library} from '../model/library.model';
import {BookService} from './book.service';
import {BookWithNeighborsDTO} from '../model/book.model';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {

  private readonly url = 'http://localhost:8080/v1/library';
  private libraries = new BehaviorSubject<Library[]>([]);
  libraries$ = this.libraries.asObservable();

  constructor(private http: HttpClient, private bookService: BookService) {
    this.http.get<Library[]>(this.url).pipe(
      catchError(error => {
        return of([]);
      })
    ).subscribe((libraries) => {
      this.libraries.next(libraries);
    });
  }

  createLibrary(newLibrary: Library): Observable<Library> {
    return this.http.post<Library>(this.url, newLibrary).pipe(
      map((createdLibrary) => {
        this.libraries.next([...this.libraries.value, createdLibrary]);
        return createdLibrary;
      }),
      catchError((error) => {
        console.error('Error creating library:', error);
        throw error;
      })
    );
  }

  deleteLibrary(libraryId: number) {
    return this.http.delete(`${this.url}/${libraryId}`).pipe(
      tap(() => {
        this.bookService.removeBooksByLibraryId(libraryId);
        const updatedLibraries = this.libraries.value.filter(library => library.id !== libraryId);
        this.libraries.next(updatedLibraries);
      }),
      catchError(error => {
        return of(null);
      })
    );
  }

  getBookWithNeighbours(libraryId: number, bookId: number): Observable<BookWithNeighborsDTO> {
    return this.http.get<BookWithNeighborsDTO>(`${this.url}/${libraryId}/book/${bookId}/withNeighbors`);
  }

}

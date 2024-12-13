import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Library, LibraryApiResponse } from '../model/library.model';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private libraryUrl: string = 'http://localhost:8080/v1/library';

  libraries = signal<Library[]>([]);

  constructor(private http: HttpClient) {
    this.getLibrariesFromAPI();
  }

  getLibrariesFromAPI(): void {
    this.http.get<LibraryApiResponse>(this.libraryUrl).pipe(
      map(response => response.content),
      catchError(error => {
        console.error('Error loading libraries:', error);
        return of([]);
      })
    ).subscribe(
      (libraries) => {
        this.libraries.set(libraries);
      }
    );
  }

  createLibrary(newLibrary: Library): Observable<Library> {
    return this.http.post<Library>(this.libraryUrl, newLibrary).pipe(
      tap((createdLibrary) => {
        this.libraries.set([...this.libraries(), createdLibrary]);
      }),
      catchError(error => {
        console.error('Error creating library:', error);
        throw error;
      })
    );
  }

  checkLibraryNameExists(name: string): Observable<any> {
    return this.http.get<Library>(`${this.libraryUrl}/search?name=${name}`).pipe(
      catchError(error => {
        console.error('Error checking library name:', error);
        return of(null);
      })
    );
  }
}

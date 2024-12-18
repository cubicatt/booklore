import {computed, Injectable, signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Library, LibraryApiResponse } from '../model/library.model';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private libraryUrl: string = 'http://localhost:8080/v1/library';

  #libraries = signal<Library[]>([]);
  libraries = computed(this.#libraries);

  constructor(private http: HttpClient) {}

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
        currentLibraries.push(createdLibrary);
        this.#libraries.set(currentLibraries);
      }),
      catchError(error => {
        console.error('Error creating library:', error);
        throw error;
      })
    );
  }

  getLibraryById(libraryId: number): Library | undefined {
    return this.#libraries().find(library => library.id === libraryId);
  }

  /*updateLibrary(id: number, updatedLibrary: Library): Observable<Library> {
    const url = `${this.libraryUrl}/${id}`;
    return this.http.put<Library>(url, updatedLibrary).pipe(
      tap((updatedLibraryFromBackend) => {
        const updatedLibraries = this._libraries().map((library) =>
          library.id === id ? { ...library, ...updatedLibraryFromBackend } : library
        );
        this._libraries.set(updatedLibraries);
      }),
      catchError((error) => {
        console.error('Error updating library:', error);
        throw error;
      })
    );
  }*/
}

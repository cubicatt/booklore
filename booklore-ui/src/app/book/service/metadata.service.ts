import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MetadataProvider} from "../model/provider.model";
import {Observable} from "rxjs";
import {BookAutoMetadataRefresh} from "../model/request/book-auto-metadata-refresh.model";
import {LibraryAutoMetadataRefreshRequest} from "../model/request/library-auto-metadata-refresh.model";
import {FetchMetadataRequest} from "../model/request/fetch-metadata-request.model";
import {BookMetadata, FetchedMetadata} from "../model/book.model";
import {BookMetadataBI} from "../model/book-metadata-for-book-info.model";
import {tap} from "rxjs/operators";
import {BookService} from "./book.service";
import {MetadataRefreshOptions} from '../../metadata-advanced-fetch-options/metadata-advanced-fetch-options.component';
import {MetadataRefreshRequest} from '../../metadata-fetch-options/metadata-fetch-options.component';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {

  private readonly url = 'http://localhost:8080/v1/metadata';

  constructor(private http: HttpClient, private bookService: BookService) {
  }

  fetchBookMetadata(bookId: number, request: FetchMetadataRequest): Observable<FetchedMetadata[]> {
    return this.http.post<FetchedMetadata[]>(`${this.url}/${bookId}`, request);
  }

  updateBookMetadata(bookId: number, bookMetadata: BookMetadataBI): Observable<BookMetadata> {
    return this.http.put<BookMetadata>(`${this.url}/${bookId}`, bookMetadata).pipe(
      tap(updatedMetadata => {
        this.bookService.handleBookMetadataUpdate(bookId, updatedMetadata);
      })
    );
  }

  autoRefreshLibraryBooksMetadataV2(metadataRefreshRequest: MetadataRefreshRequest) {
    return this.http.put<void>(`${this.url}/refreshV2`, metadataRefreshRequest);
  }

  autoRefreshLibraryBooksMetadata(libraryId: number, metadataProvider: MetadataProvider, replaceCover: boolean): Observable<void> {
    const requestPayload: LibraryAutoMetadataRefreshRequest = {
      libraryId: libraryId,
      metadataProvider: metadataProvider,
      replaceCover: replaceCover
    }
    return this.http.put<void>(`${this.url}/library/${libraryId}/refresh`, requestPayload);
  }

  autoRefreshBooksMetadata(selectedBooks: Set<number>, metadataProvider: MetadataProvider, replaceCover: boolean): Observable<void> {
    const requestPayload: BookAutoMetadataRefresh = {
      bookIds: Array.from(selectedBooks),
      metadataProvider: metadataProvider,
      replaceCover
    };
    return this.http.put<void>(`${this.url}/books/refresh`, requestPayload);
  }
}

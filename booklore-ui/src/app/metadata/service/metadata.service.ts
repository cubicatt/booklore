import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from "rxjs";
import {FetchMetadataRequest} from "../model/request/fetch-metadata-request.model";
import {BookMetadata, FetchedMetadata} from "../../book/model/book.model";
import {tap} from "rxjs/operators";
import {BookService} from "../../book/service/book.service";
import {MetadataRefreshRequest} from '../model/request/metadata-refresh-request.model';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {

  private readonly url = 'http://localhost:8080/v1/metadata';

  private http = inject(HttpClient);
  private bookService = inject(BookService);

  fetchBookMetadata(bookId: number, request: FetchMetadataRequest): Observable<FetchedMetadata[]> {
    return this.http.post<FetchedMetadata[]>(`${this.url}/${bookId}`, request);
  }

  updateBookMetadata(bookId: number, bookMetadata: BookMetadata): Observable<BookMetadata> {
    return this.http.put<BookMetadata>(`${this.url}/${bookId}`, bookMetadata).pipe(
      tap(updatedMetadata => {
        this.bookService.handleBookMetadataUpdate(bookId, updatedMetadata);
      })
    );
  }

  autoRefreshMetadata(metadataRefreshRequest: MetadataRefreshRequest) {
    return this.http.put<void>(`${this.url}/refreshV2`, metadataRefreshRequest);
  }
}

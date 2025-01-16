import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EpubService {
  private baseUrl = 'http://localhost:8080/api/epub';

  private http = inject(HttpClient);

  downloadEpub(bookId: number): Observable<Blob> {
    const url = `${this.baseUrl}/${bookId}/download`;
    return this.http.get(url, {responseType: 'blob'});
  }
}

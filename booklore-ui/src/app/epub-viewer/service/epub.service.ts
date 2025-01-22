import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {API_CONFIG} from '../../config/api-config';

@Injectable({
  providedIn: 'root',
})
export class EpubService {
  private baseUrl = `${API_CONFIG.BASE_URL}/api/epub`;

  private http = inject(HttpClient);

  downloadEpub(bookId: number): Observable<Blob> {
    const url = `${this.baseUrl}/${bookId}/download`;
    return this.http.get(url, {responseType: 'blob'});
  }
}

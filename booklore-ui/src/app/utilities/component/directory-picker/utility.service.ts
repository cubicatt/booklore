import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpParams} from '@angular/common/http';
import {API_CONFIG} from '../../../config/api-config';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  private pathUrl = `${API_CONFIG.BASE_URL}/v1/path`;

  private http = inject(HttpClient);

  getFolders(path: string): Observable<string[]> {
    const params = new HttpParams().set('path', path);
    return this.http.get<string[]>(this.pathUrl, {params});
  }
}

import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  private pathUrl = 'http://localhost:8080/v1/path';

  private http = inject(HttpClient);

  getFolders(path: string): Observable<string[]> {
    const params = new HttpParams().set('path', path);
    return this.http.get<string[]>(this.pathUrl, {params});
  }
}

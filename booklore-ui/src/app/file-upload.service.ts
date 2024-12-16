import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  private uploadUrl = 'http://localhost:8080/api/v1/files/upload';

  constructor(private http: HttpClient) { }

  uploadFile(file: File, libraryId: string, filePath: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('libraryId', libraryId);
    formData.append('filePath', filePath);
    return this.http.post(this.uploadUrl, formData).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }
}

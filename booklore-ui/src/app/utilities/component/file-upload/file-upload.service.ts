import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  private uploadUrl = 'http://localhost:8080/api/v1/files/upload';

  private httpClient = inject(HttpClient);

  uploadFile(file: File, libraryId: string, filePath: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('libraryId', libraryId);
    formData.append('filePath', filePath);
    return this.httpClient.post(this.uploadUrl, formData).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }
}

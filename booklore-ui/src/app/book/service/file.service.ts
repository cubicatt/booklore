import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {API_CONFIG} from '../../config/api-config';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private readonly url = `${API_CONFIG.BASE_URL}/v1/book`;
  private readonly http = inject(HttpClient);

  downloadFile(bookId: number): void {
    const downloadUrl = `${this.url}/${bookId}/download`;
    this.http.get(downloadUrl, {responseType: 'blob', observe: 'response'})
      .subscribe({
        next: (response) => {
          const contentDisposition = response.headers.get('Content-Disposition');
          const filename = contentDisposition
            ? contentDisposition.match(/filename="(.+?)"/)?.[1] || `book_${bookId}.pdf`
            : `book_${bookId}.pdf`;
          this.saveFile(response.body as Blob, filename);
        },
        error: (err) => console.error('Error downloading file:', err),
      });
  }

  private saveFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

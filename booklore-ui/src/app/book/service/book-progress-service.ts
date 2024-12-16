import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BookUpdateEvent} from '../model/book-update-event.model';

@Injectable({
  providedIn: 'root',
})
export class BookProgressService {
  private eventSource: EventSource | null = null;

  connect(libraryId: number): Observable<BookUpdateEvent> {
    const url = `http://localhost:8080/v1/library/${libraryId}/parse`;

    return new Observable((observer) => {
      this.eventSource = new EventSource(url);

      this.eventSource.onmessage = (event) => {
        const data: BookUpdateEvent = JSON.parse(event.data);
        observer.next(data);
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        observer.error(error);
      };

      return () => {
        this.closeConnection();
      };
    });
  }

  closeConnection(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('SSE connection closed');
    }
  }
}

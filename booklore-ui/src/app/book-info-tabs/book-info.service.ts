import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {BookMetadataBI} from '../book/model/book-metadata-for-book-info.model';

@Injectable({
  providedIn: 'root'
})
export class BookInfoService {

  private subject = new BehaviorSubject<BookMetadataBI | null>(null);
  bookMetadata$ = this.subject.asObservable();

  emit(bookMetadata: BookMetadataBI) {
    this.subject.next(bookMetadata);
  }
}

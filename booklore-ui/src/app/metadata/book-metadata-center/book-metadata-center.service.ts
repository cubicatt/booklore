import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Book, BookMetadata} from '../../book/model/book.model';

@Injectable({
  providedIn: 'root'
})
export class BookMetadataCenterService {

  private bookMetadataSubject = new BehaviorSubject<BookMetadata | null>(null);
  bookMetadata$ = this.bookMetadataSubject.asObservable();

  private dialogCloseSubject = new BehaviorSubject<boolean | null>(null);
  dialogClose$ = this.dialogCloseSubject.asObservable();

  emit(bookMetadata: BookMetadata) {
    this.bookMetadataSubject.next(bookMetadata);
  }

  closeDialog(close: boolean) {
    return this.dialogCloseSubject.next(close);
  }
}

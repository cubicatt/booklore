import { Injectable } from '@angular/core';
import {DialogService} from 'primeng/dynamicdialog';
import {BookService} from '../../book/service/book.service';
import {BookMetadataCenterComponent} from '../book-metadata-center/book-metadata-center.component';

@Injectable({
  providedIn: 'root'
})
export class MetadataDialogService {

  constructor(private dialogService: DialogService, private bookService: BookService) {}

  public openBookDetailsDialog(bookId: number): void {
    this.bookService.getBookByIdFromAPI(bookId, true).subscribe({
      next: (book) => {
        this.dialogService.open(BookMetadataCenterComponent, {
          header: 'Open book details',
          modal: true,
          closable: true,
          width: '1200px',
          height: '835px',
          showHeader: false,
          closeOnEscape: true,
          dismissableMask: true,
          data: {
            book: book,
          },
        });
      },
      error: (error) => {
        console.error('Error fetching book:', error);
      },
    });
  }
}

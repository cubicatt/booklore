import { Component } from '@angular/core';
import {Observable} from 'rxjs';
import {BookState} from '../../model/state/book-state.model';
import {TableModule} from 'primeng/table';
import {AsyncPipe, NgIf} from '@angular/common';
import {ProgressSpinner} from 'primeng/progressspinner';
import {BookService} from '../../service/book.service';
import {Rating} from 'primeng/rating';
import {FormsModule} from '@angular/forms';
import {BookMetadataCenterComponent} from '../../../book-metadata-center/book-metadata-center.component';
import {DialogService} from 'primeng/dynamicdialog';

@Component({
  selector: 'app-book-table',
  standalone: true,
  templateUrl: './book-table.component.html',
  imports: [
    TableModule,
    AsyncPipe,
    NgIf,
    ProgressSpinner,
    Rating,
    FormsModule
  ],
  styleUrl: './book-table.component.scss'
})
export class BookTableComponent {
  bookState$: Observable<BookState>;

  constructor(private bookService: BookService, private dialogService: DialogService) {
    this.bookState$ = this.bookService.bookState$;
  }

  getBookCoverUrl(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }

  openMetadataCenter(id: number) {
    this.openBookDetailsDialog(id);
  }

  openBookDetailsDialog(bookId: number): void {
    this.bookService.getBookByIdFromAPI(bookId, true).subscribe(({
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
            book: book
          }
        });
      },
      error: (error) => {
        console.error('Error fetching book:', error);
      }
    }))
  }
}

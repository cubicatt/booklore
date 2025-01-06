import { Component } from '@angular/core';
import {Observable} from 'rxjs';
import {BookState} from '../../model/state/book-state.model';
import {TableModule} from 'primeng/table';
import {AsyncPipe, NgIf} from '@angular/common';
import {ProgressSpinner} from 'primeng/progressspinner';
import {BookService} from '../../service/book.service';
import {Rating} from 'primeng/rating';
import {FormsModule} from '@angular/forms';

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

  constructor(private bookService: BookService) {
    this.bookState$ = this.bookService.bookState$;
  }

  getBookCoverUrl(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }
}

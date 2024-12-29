import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BookService } from '../../service/book.service';
import { BookState } from '../../model/state/book-state.model';
import { BookCardComponent } from '../book-card/book-card.component';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-dashboard-scroller',
  templateUrl: './dashboard-scroller.component.html',
  styleUrls: ['./dashboard-scroller.component.scss'],
  imports: [
    InfiniteScrollDirective,
    NgForOf,
    NgIf,
    BookCardComponent,
    AsyncPipe
  ],
})
export class DashboardScrollerComponent implements OnInit {

  @Input() bookListType: 'lastRead' | 'latestAdded' = 'lastRead';
  @Input() title: string = 'Last Read Books';
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  bookState$: Observable<BookState> | undefined;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    if (this.bookListType === 'lastRead') {
      this.bookState$ = this.bookService.bookState$.pipe(
        map((state: BookState) => ({
          ...state,
          books: (state.books || [])
            .filter(book => book.lastReadTime)
            .sort((a, b) => new Date(b.lastReadTime!).getTime() - new Date(a.lastReadTime!).getTime())
            .slice(0, 25)
        }))
      );
    }

    if (this.bookListType === 'latestAdded') {
      this.bookState$ = this.bookService.bookState$.pipe(
        map((state: BookState) => ({
          ...state,
          books: (state.books || [])
            .filter(book => book.addedOn)
            .sort((a, b) => new Date(b.addedOn!).getTime() - new Date(a.addedOn!).getTime())
            .slice(0, 25)
        }))
      );
    }
  }
}

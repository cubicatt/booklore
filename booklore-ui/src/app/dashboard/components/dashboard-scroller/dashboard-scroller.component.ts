import {Component, ElementRef, inject, Input, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {BookService} from '../../../book/service/book.service';
import {BookState} from '../../../book/model/state/book-state.model';
import {BookCardComponent} from '../../../book/components/book-browser/book-card/book-card.component';
import {InfiniteScrollDirective} from 'ngx-infinite-scroll';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {Book} from 'epubjs';

@Component({
  selector: 'app-dashboard-scroller',
  templateUrl: './dashboard-scroller.component.html',
  styleUrls: ['./dashboard-scroller.component.scss'],
  imports: [
    InfiniteScrollDirective,
    NgForOf,
    NgIf,
    BookCardComponent,
    AsyncPipe,
    ProgressSpinnerModule
  ],
})
export class DashboardScrollerComponent implements OnInit {

  @Input() bookListType: 'lastRead' | 'latestAdded' = 'lastRead';
  @Input() title: string = 'Last Read Books';
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  bookState$: Observable<BookState> | undefined;

  private bookService = inject(BookService);
  @Input() books: Observable<Book[]> | undefined;

  ngOnInit(): void {
    if (this.bookListType === 'lastRead') {
      this.bookState$ = this.bookService.bookState$.pipe(
        map((state: BookState) => ({
          ...state,
          books: (state.books || [])
            .filter(book => book.lastReadTime)
            .sort((a, b) => {
              const aTime = new Date(a.lastReadTime!).getTime();
              const bTime = new Date(b.lastReadTime!).getTime();
              return bTime - aTime;
            })
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
            .sort((a, b) => {
              const aTime = new Date(a.addedOn!).getTime();
              const bTime = new Date(b.addedOn!).getTime();
              return bTime - aTime;
            })
            .slice(0, 25)
        }))
      );
    }
  }
}

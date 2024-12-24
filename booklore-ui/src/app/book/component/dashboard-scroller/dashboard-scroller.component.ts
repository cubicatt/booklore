import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Book} from '../../model/book.model';
import {InfiniteScrollDirective} from 'ngx-infinite-scroll';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {BookCardComponent} from '../book-card/book-card.component';
import {Observable} from 'rxjs';
import {BookService} from '../../service/book.service';
import {map} from 'rxjs/operators';

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

  books$: Observable<Book[]> | undefined;

  constructor(private bookService: BookService) {
  }

  ngOnInit(): void {
    if (this.bookListType === 'lastRead') {
      this.books$ = this.bookService.books$.pipe((
        map(books =>
            books
              .filter(book => book.lastReadTime)
              .sort((a, b) => new Date(b.lastReadTime!).getTime() - new Date(a.lastReadTime!).getTime())
              .slice(0, 25)
        )
      ))
    }
    if (this.bookListType === 'latestAdded') {
      this.books$ = this.bookService.books$.pipe((
        map(books =>
          books
            .filter(book => book.addedOn)
            .sort((a, b) => new Date(b.addedOn!).getTime() - new Date(a.addedOn!).getTime())
            .slice(0, 25)
        )
      ))
    }
  }
}

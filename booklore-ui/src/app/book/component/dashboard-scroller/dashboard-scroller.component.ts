import {Component, OnInit, ViewChild, ElementRef, Input, computed, signal, Signal} from '@angular/core';
import {Book} from '../../model/book.model';
import {LibraryAndBookService} from '../../service/library-and-book.service';
import {Button} from 'primeng/button';
import {InfiniteScrollDirective} from 'ngx-infinite-scroll';
import {NgForOf, NgIf} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-dashboard-scroller',
  templateUrl: './dashboard-scroller.component.html',
  styleUrls: ['./dashboard-scroller.component.scss'],
  imports: [
    Button,
    InfiniteScrollDirective,
    NgForOf,
    NgIf
  ],
})
export class DashboardScrollerComponent implements OnInit {

  @Input() bookListType: 'lastRead' | 'latestAdded' = 'lastRead';
  @Input() title: string = 'Last Read Books';
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  booksSignal: Signal<Book[]> | undefined;

  constructor(private bookService: LibraryAndBookService, private router: Router) {
  }

  ngOnInit(): void {
    this.booksSignal = this.bookListType === 'lastRead' ? this.bookService.getLastReadBooks() : this.bookService.getLatestAddedBooks();;
    this.loadBooks();
  }

  loadBooks(): void {
    if (this.bookListType === 'lastRead' && !this.bookService.getLastReadBooks()) {
      this.bookService.getLastReadBooks();
    } else if (this.bookListType === 'latestAdded' && !this.bookService.getLatestAddedBooks()) {
      this.bookService.getLatestAddedBooks();
    }
  }

  coverImageSrc(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }

  getAuthorNames(book: Book): string {
    return book.metadata?.authors?.map((author) => author.name).join(', ') || 'No authors available';
  }

  openBook(book: Book): void {
    this.bookService.readBook(book);
  }

  openBookInfo(bookId: number, libraryId: number) {
    this.router.navigate(['/library', libraryId, 'book', bookId, 'info']);
  }
}

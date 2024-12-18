import {Component, OnInit, ViewChild, ElementRef, Input, computed, signal} from '@angular/core';
import {Book} from '../../model/book.model';
import {BookService} from '../../service/book.service';
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

  private currentPage: number = 0;

  booksSignal = computed(() => {
    return this.bookListType === 'lastRead' ? this.bookService.lastReadBooks() : this.bookService.latestAddedBooks();
  });

  constructor(private bookService: BookService, private router: Router) {
  }

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    if (this.bookListType === 'lastRead') {
      this.bookService.getLastReadBooks(this.currentPage);
    } else {
      this.bookService.getLatestAddedBooks(this.currentPage);
    }
    this.currentPage++;
  }

  coverImageSrc(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }

  getAuthorNames(book: Book): string {
    return book.metadata.authors?.map((author) => author.name).join(', ') || 'No authors available';
  }

  openBook(bookId: number): void {
    const url = `/pdf-viewer/book/${bookId}`;
    window.open(url, '_blank');
  }

  loadMore() {
    /*this.loadBooks();
    this.currentPage++;*/
  }

  onScroll(event: any): void {
    /*const container = this.scrollContainer.nativeElement;
    const scrollRight = container.scrollWidth - container.scrollLeft === container.clientWidth;
    if (scrollRight) {
      this.currentPage++;
      this.loadBooks();
    }*/
  }

  openBookInfo(bookId: number, libraryId: number) {
    this.router.navigate(['/library', libraryId, 'book', bookId, 'info']);
  }
}

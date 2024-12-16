import {Component, OnInit, ViewChild, ElementRef, Input} from '@angular/core';
import {Book} from '../../model/book.model';
import {BookService} from '../../service/book.service';
import {Button} from 'primeng/button';
import {InfiniteScrollDirective} from 'ngx-infinite-scroll';
import {NgForOf} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-dashboard-scroller',
  templateUrl: './dashboard-scroller.component.html',
  imports: [
    Button,
    InfiniteScrollDirective,
    NgForOf
  ],
  styleUrls: ['./dashboard-scroller.component.scss']
})
export class DashboardScrollerComponent implements OnInit {

  @Input() bookListType: 'lastRead' | 'latestAdded' = 'lastRead';
  @Input() title: string = 'Last Read Books';


  books: Book[] = [];
  private currentPage: number = 0;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  constructor(private bookService: BookService, private router: Router) {
  }

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    if (this.bookListType === 'lastRead') {
      this.bookService.loadLatestBooks(this.currentPage).subscribe({
        next: (response) => {
          this.books = [...this.books, ...response.content];
          this.currentPage++;
        },
        error: (err) => {
          console.error('Error loading books:', err);
        },
      });
    } else {
      this.bookService.loadLatestAddedBooks(this.currentPage).subscribe({
        next: (response) => {
          this.books = [...this.books, ...response.content];
          this.currentPage++;
        },
        error: (err) => {
          console.error('Error loading books:', err);
        },
      });
    }
  }

  coverImageSrc(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }

  loadMore(): void {
    console.log('Loading more books...');
    this.loadBooks();
  }

  getAuthorNames(book: Book): string {
    return book.metadata.authors?.map((author) => author.name).join(', ') || 'No authors available';
  }

  openBook(bookId: number): void {
    const url = `/pdf-viewer/book/${bookId}`;
    window.open(url, '_blank');
  }


  onScroll(event: any): void {
    const container = this.scrollContainer.nativeElement;
    const scrollRight = container.scrollWidth - container.scrollLeft === container.clientWidth;
    if (scrollRight) {
      this.loadMore();
    }
  }

  openBookInfo(bookId: number) {
    this.router.navigate(['/book', bookId, 'info']);
  }
}

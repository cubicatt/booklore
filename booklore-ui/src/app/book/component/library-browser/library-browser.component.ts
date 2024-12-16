import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookProgressService } from '../../service/book-progress-service';
import { BookUpdateEvent } from '../../model/book-update-event.model';
import { BookService } from '../../service/book.service';
import { Book } from '../../model/book.model';
import { combineLatest } from 'rxjs';
import {InfiniteScrollDirective} from 'ngx-infinite-scroll';
import {Button} from 'primeng/button';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-library-browser-v2',
  templateUrl: './library-browser.component.html',
  styleUrls: ['./library-browser.component.scss'],
  imports: [
    InfiniteScrollDirective,
    Button,
    NgForOf
  ]
})
export class LibraryBrowserComponent implements OnInit {
  books: Book[] = [];
  private libraryId: number = 1;
  private currentPage: number = 0;

  constructor(
    private bookService: BookService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private bookProgressService: BookProgressService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.queryParamMap])
      .subscribe(([params, queryParams]) => {
        const libraryId = params.get('libraryId');
        if (libraryId) {
          this.libraryId = +libraryId;
          this.resetState();
          this.loadBooks();
        }
        const watch = queryParams.get('watch');
        if (watch) {
          this.startListeningForProgress();
        }
      });
  }

  startListeningForProgress(): void {
    this.bookProgressService.connect(this.libraryId).subscribe({
      next: (event: BookUpdateEvent) => this.addBookToCollection(event),
      error: (error) => console.error('Error receiving progress updates:', error),
    });
  }

  addBookToCollection(event: BookUpdateEvent): void {
    if(event.parsingStatus === 'PARSED_NEW_BOOK') {
      const newBook: Book = {
        id: event.book.id,
        libraryId: event.book.libraryId,
        metadata: event.book.metadata,
      };
      this.ngZone.run(() => {
        if (!this.books.find((book) => book.id === newBook.id)) {
          this.books = [newBook, ...this.books];
        }
      });
    } else {
      console.error('Status other than: PARSED_NEW_BOOK');
    }
  }

  resetState(): void {
    console.log("resetState")
    this.books = [];
    this.currentPage = 0;
  }

  loadBooks(): void {
    this.bookService.loadBooks(this.libraryId, this.currentPage).subscribe({
      next: (response) => {
        this.books = [...this.books, ...response.content];
        this.currentPage++;
      },
      error: (err) => console.error('Error loading books:', err),
    });
  }

  coverImageSrc(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }

  loadMore(): void {
    this.loadBooks();
  }

  getAuthorNames(book: Book): string {
    return book.metadata.authors?.map((author) => author.name).join(', ') || 'No authors available';
  }

  readBook(bookId: number): void {
    const url = `/pdf-viewer/book/${bookId}`;
    window.open(url, '_blank');
  }

  openBookInfo(bookId: number) {
    this.router.navigate(['/book', bookId, 'info']);
  }
}

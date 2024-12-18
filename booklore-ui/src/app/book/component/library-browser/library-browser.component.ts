import {Component, computed, NgZone, OnChanges, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {BookProgressService} from '../../service/book-progress-service';
import {BookService} from '../../service/book.service';
import {Book, BookUpdateEvent} from '../../model/book.model';
import {combineLatest} from 'rxjs';
import {InfiniteScrollDirective} from 'ngx-infinite-scroll';
import {Button} from 'primeng/button';
import {NgClass, NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DropdownModule} from 'primeng/dropdown';
import {LibraryService} from '../../service/library.service';

@Component({
  selector: 'app-library-browser-v2',
  templateUrl: './library-browser.component.html',
  styleUrls: ['./library-browser.component.scss'],
  imports: [
    InfiniteScrollDirective,
    Button,
    NgForOf,
    FormsModule,
    DropdownModule,
    NgClass
  ]
})
export class LibraryBrowserComponent implements OnInit {
  books: Book[] = [];
  private libraryIdSignal = signal(1);
  private currentPage: number = 0;
  cities: any[] | undefined;
  selectedCity: any;
  coverSizeClass = 'medium';
  coverSizeClasses = ['small', 'medium', 'large', 'extra-large'];

  libraryNameSignal = computed(() => {
    const library = this.libraryService
      .libraries()
      .find((library) => library.id === this.libraryIdSignal());
    return library ? library.name : 'Library not found';
  });

  constructor(
    private bookService: BookService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private bookProgressService: BookProgressService,
    private ngZone: NgZone,
    private libraryService: LibraryService
  ) {}

  ngOnInit(): void {
    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.queryParamMap])
      .subscribe(([params, queryParams]) => {
        const libraryId = params.get('libraryId');
        if (libraryId) {
          this.libraryIdSignal.set(+libraryId);
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
    this.bookProgressService.connect(this.libraryIdSignal()).subscribe({
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
    this.books = [];
    this.currentPage = 0;
  }

  loadBooks(): void {
    this.bookService.loadBooks(this.libraryIdSignal(), this.currentPage).subscribe({
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

  openBookInfo(bookId: number, libraryId: number) {
    this.router.navigate(['/library', libraryId, 'book', bookId, 'info']);
  }

  getCurrentSizeIndex(): number {
    return this.coverSizeClasses.indexOf(this.coverSizeClass);
  }

  increaseSize() {
    const currentIndex = this.getCurrentSizeIndex();
    if (currentIndex < this.coverSizeClasses.length - 1) {
      this.coverSizeClass = this.coverSizeClasses[currentIndex + 1];
    }
  }

  decreaseSize() {
    const currentIndex = this.getCurrentSizeIndex();
    if (currentIndex > 0) {
      this.coverSizeClass = this.coverSizeClasses[currentIndex - 1];
    }
  }

  isIncreaseDisabled(): boolean {
    return this.coverSizeClass === this.coverSizeClasses[this.coverSizeClasses.length - 1];
  }

  isDecreaseDisabled(): boolean {
    return this.coverSizeClass === this.coverSizeClasses[0];
  }
}

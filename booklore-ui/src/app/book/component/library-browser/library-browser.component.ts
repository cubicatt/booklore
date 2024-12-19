import {Component, computed, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {BookService} from '../../service/book.service';
import {Book} from '../../model/book.model';
import {combineLatest} from 'rxjs';
import {Button} from 'primeng/button';
import {NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DropdownModule} from 'primeng/dropdown';
import {LibraryService} from '../../service/library.service';
import {LazyLoadImageModule} from 'ng-lazyload-image';
import {VirtualScrollerModule} from '@iharbeck/ngx-virtual-scroller';

@Component({
  selector: 'app-library-browser-v2',
  templateUrl: './library-browser.component.html',
  styleUrls: ['./library-browser.component.scss'],
  imports: [
    Button,
    NgForOf,
    FormsModule,
    DropdownModule,
    LazyLoadImageModule,
    VirtualScrollerModule
  ]
})
export class LibraryBrowserComponent implements OnInit {
  coverSizeClass = 'medium';
  coverSizeClasses = ['small', 'medium', 'large', 'extra-large'];

  private libraryIdSignal = signal(1);
  libraryNameSignal = computed(() => {
    const library = this.libraryService
      .libraries()
      .find((library) => library.id === this.libraryIdSignal());
    return library ? library.name : 'Library not found';
  });
  selectedCity: any;
  cities: any[] | undefined;

  booksSignal = computed(() => {
    return this.bookService.libraryBooks();
  });

  constructor(
    private bookService: BookService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private libraryService: LibraryService) {
  }

  ngOnInit(): void {
    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.queryParamMap])
      .subscribe(([params, queryParams]) => {
        const libraryId = params.get('libraryId');
        const watch = queryParams.get('watch');
      });
  }

  coverImageSrc(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {Book} from '../../book/model/book.model';
import {Observable, Subscription} from 'rxjs';
import {BookService} from '../../book/service/book.service';
import {ActivatedRoute, Router} from '@angular/router';
import {LibraryService} from '../../book/service/library.service';
import {BookMetadataBI} from '../../book/model/book-metadata-for-book-info.model';
import {BookInfoService} from '../book-info.service';
import {Divider} from 'primeng/divider';
import {Rating} from 'primeng/rating';
import {FormsModule} from '@angular/forms';
import {Chip} from 'primeng/chip';
import {Tag} from 'primeng/tag';

@Component({
  selector: 'app-book-metadata-viewer',
  standalone: true,
  templateUrl: './book-metadata-viewer.component.html',
  imports: [
    Button,
    NgForOf,
    NgIf,
    AsyncPipe,
    Divider,
    Rating,
    FormsModule,
    Tag
  ],
  styleUrl: './book-metadata-viewer.component.scss'
})
export class BookMetadataViewerComponent implements OnInit {

  bookMetadata$: Observable<BookMetadataBI | null>;
  currentBookId!: number;

  constructor(private bookService: BookService, private router: Router, private bookInfoService: BookInfoService) {
    this.bookMetadata$ = this.bookInfoService.bookMetadata$;
  }

  ngOnInit(): void {
    this.bookMetadata$.subscribe((bookMetadata) => {
      if(bookMetadata) {
        this.currentBookId = bookMetadata?.bookId;
      }
    })
  }

  navigateToBook(bookId: number | null, libraryId: number | null): void {
    if (bookId && libraryId) {
      this.router.navigate(['/library', libraryId, 'book', bookId, 'info']);
    }
  }

  getAuthorNames(book: Book | null): string {
    if (book && book.metadata && book.metadata.authors) {
      return book.metadata.authors.map((author) => author.name).join(', ');
    }
    return 'No authors available';
  }

  coverImageSrc(bookId: number | undefined): string {
    if (bookId === null) {
      return 'assets/book-cover-metadata.png';
    }
    return this.bookService.getBookCoverUrl(bookId!);
  }

  readBook(bookId: number) {
    this.bookService.readBook(bookId);
  }

  closeDialog() {
    return this.bookInfoService.closeDialog(true);
  }
}

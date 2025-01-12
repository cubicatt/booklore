import {Component, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {Book} from '../../../book/model/book.model';
import {Observable} from 'rxjs';
import {BookService} from '../../../book/service/book.service';
import {Router} from '@angular/router';
import {BookMetadataBI} from '../../model/book-metadata-for-book-info.model';
import {BookMetadataCenterService} from '../book-metadata-center.service';
import {Rating} from 'primeng/rating';
import {FormsModule} from '@angular/forms';
import {Tag} from 'primeng/tag';
import {Editor} from 'primeng/editor';

@Component({
  selector: 'app-metadata-viewer',
  standalone: true,
  templateUrl: './metadata-viewer.component.html',
  styleUrl: './metadata-viewer.component.scss',
  imports: [
    Button,
    NgForOf,
    NgIf,
    AsyncPipe,
    Rating,
    FormsModule,
    Tag,
    Editor
  ]
})
export class MetadataViewerComponent implements OnInit {

  bookMetadata$: Observable<BookMetadataBI | null>;
  currentBookId!: number;

  constructor(private bookService: BookService, private router: Router, private bookInfoService: BookMetadataCenterService) {
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

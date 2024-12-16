import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {BookService} from '../book/service/book.service';
import {Book} from '../book/model/book.model';
import {Button} from 'primeng/button';
import {NgForOf} from '@angular/common';
import {BooksMetadataDialogComponent} from '../books-metadata-dialog/books-metadata-dialog.component';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Subscription} from 'rxjs';
import {TagModule} from 'primeng/tag';

@Component({
  selector: 'app-book-metadata',
  templateUrl: './book-metadata.component.html',
  styleUrls: ['./book-metadata.component.scss'],
  imports: [
    Button,
    NgForOf,
    TagModule
  ]
})
export class BookMetadataComponent implements OnInit, OnDestroy {
  book: Book | null = null;
  private routeSubscription!: Subscription;
  ref: DynamicDialogRef | undefined;

  constructor(
    private bookService: BookService,
    private activatedRoute: ActivatedRoute,
    private dialogService: DialogService) {
  }

  ngOnInit(): void {
    this.routeSubscription = this.activatedRoute.paramMap.subscribe((paramMap) => {
      const bookId = +paramMap.get('bookId')!;
      if (bookId) {
        this.loadBook(bookId);
      }
    });
  }

  private loadBook(bookId: number): void {
    this.bookService.getBook(bookId).subscribe((book) => {
      this.book = book;
    });
  }

  getAuthorNames(book: Book | null): string {
    if (book && book.metadata && book.metadata.authors) {
      return book.metadata.authors.map((author) => author.name).join(', ');
    }
    return 'No authors available';
  }

  openEditDialog(id: number | undefined) {
    this.ref = this.dialogService.open(BooksMetadataDialogComponent, {
      header: 'Fetch Metadata (from Google Books)',
      modal: false,
      width: '65%',
      height: '85%',
      data: {
        bookId: id,
        bookTitle: this.book?.metadata.title,
      },
    });

    this.ref.onClose.subscribe(() => {
      // @ts-ignore
      this.loadBook(this.book?.id);
    });
  }


  coverImageSrc(bookId: any): string {
    if (bookId === null) {
      return 'assets/placeholder.png';
    }
    return this.bookService.getBookCoverUrl(bookId);
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  readBook(id: number | undefined) {
    const url = `/pdf-viewer/book/${id}`;
    window.open(url, '_blank');
  }
}

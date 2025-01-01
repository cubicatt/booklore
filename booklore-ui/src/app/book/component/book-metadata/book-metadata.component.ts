import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Book} from '../../model/book.model';
import {Button} from 'primeng/button';
import {NgForOf, NgIf} from '@angular/common';
import {BookMetadataDialogComponent} from '../book-metadata-dialog/book-metadata-dialog.component';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Subscription} from 'rxjs';
import {TagModule} from 'primeng/tag';
import {BookService} from '../../service/book.service';
import {LibraryService} from '../../service/library.service';
import {MetadataSearcherComponent} from '../../../metadata-searcher/metadata-searcher.component';
import {ProgressSpinner} from 'primeng/progressspinner';
import {LoadingService} from '../../../loading.service';

@Component({
  selector: 'app-book-metadata',
  templateUrl: './book-metadata.component.html',
  styleUrls: ['./book-metadata.component.scss'],
  imports: [
    Button,
    NgForOf,
    TagModule,
    NgIf
  ]
})
export class BookMetadataComponent implements OnInit, OnDestroy {
  book: Book | null = null;
  nextBookId: number | null = null;
  previousBookId: number | null = null;

  private routeSubscription!: Subscription;
  private dialogRef!: DynamicDialogRef;
  private dialogSubscription?: Subscription;

  constructor(
    private bookService: BookService, private activatedRoute: ActivatedRoute,
    private dialogService: DialogService, private router: Router,
    private libraryService: LibraryService, private loadingService: LoadingService,) {
  }

  ngOnInit(): void {
    this.routeSubscription = this.activatedRoute.paramMap.subscribe((paramMap) => {
      const bookId = +paramMap.get('bookId')!;
      const libraryId = +paramMap.get('libraryId')!;
      if (bookId && libraryId) {
        this.loadBookWithNeighbors(bookId, libraryId);
      }
    });
  }

  private loadBookWithNeighbors(libraryId: number, bookId: number): void {
    this.libraryService.getBookWithNeighbours(bookId, libraryId).subscribe((response) => {
      this.book = response.currentBook;
      this.nextBookId = response.nextBookId;
      this.previousBookId = response.previousBookId;
    });
  }

  navigateToBook(bookId: number | null, libraryId: number | null): void {
    if (bookId && libraryId) {
      this.router.navigate(['/library', libraryId, 'book', bookId, 'info']);
    }
  }

  canGoNext(): boolean {
    return this.nextBookId !== null;
  }

  canGoPrevious(): boolean {
    return this.previousBookId !== null;
  }

  getAuthorNames(book: Book | null): string {
    if (book && book.metadata && book.metadata.authors) {
      return book.metadata.authors.map((author) => author.name).join(', ');
    }
    return 'No authors available';
  }

  openEditDialog(bookId: number, libraryId: number) {
    this.loadingService.show();
    this.bookService.getFetchBookMetadata(bookId).subscribe({
      next: (fetchedMetadata) => {
        this.loadingService.hide();
        this.dialogRef = this.dialogService.open(MetadataSearcherComponent, {
          header: 'Update Book Metadata',
          modal: true,
          closable: true,
          width: '1350px',
          height: '1000px',
          contentStyle: {
            'overflow-y': 'auto',
            'max-height': 'calc(100vh - 150px)',
            'padding': '1.25rem 1.25rem 0',
          },
          data: {
            currentMetadata: this.book?.metadata,
            fetchedMetadata: fetchedMetadata,
            book: this.book
          }
        });

        if (this.dialogRef) {
          this.dialogSubscription = this.dialogRef.onClose.subscribe(() => {
            if (this.book?.id && this.book?.libraryId) {
              this.loadBookWithNeighbors(this.book.id, this.book.libraryId);
            }
          });
        } else {
          console.error('DialogRef is undefined or null');
        }
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Error fetching metadata:', error);
      }
    });
  }

  /*openEditDialog1(bookId: number | undefined, libraryId: number | undefined) {
    this.dialogRef = this.dialogService.open(BookMetadataDialogComponent, {
      header: 'Metadata: Google Books',
      modal: true,
      closable: true,
      width: '65%',
      height: '85%',
      data: {
        bookId: bookId,
        libraryId: libraryId,
        bookTitle: this.book?.metadata?.title,
      },
    });

    this.dialogSubscription = this.dialogRef.onClose.subscribe(() => {
      if (this.book?.id && this.book.libraryId) {
        this.loadBookWithNeighbors(this.book.id, this.book.libraryId);
      }
    });
  }*/

  coverImageSrc(bookId: number | undefined): string {
    if (bookId === null) {
      return 'assets/book-cover-metadata.png';
    }
    return this.bookService.getBookCoverUrl(bookId!);
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  readBook(book: Book) {
    this.bookService.readBook(book);
  }
}

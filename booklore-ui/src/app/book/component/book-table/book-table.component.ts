import {ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnChanges, Output, SimpleChanges} from '@angular/core';
import {TableModule} from 'primeng/table';
import {NgIf} from '@angular/common';
import {BookService} from '../../service/book.service';
import {Rating} from 'primeng/rating';
import {FormsModule} from '@angular/forms';
import {BookMetadataCenterComponent} from '../../../book-metadata-center/book-metadata-center.component';
import {DialogService} from 'primeng/dynamicdialog';
import {Book} from '../../model/book.model';

@Component({
  selector: 'app-book-table',
  standalone: true,
  templateUrl: './book-table.component.html',
  imports: [
    TableModule,
    NgIf,
    Rating,
    FormsModule
  ],
  styleUrl: './book-table.component.scss'
})
export class BookTableComponent {
  selectedBooks: Book[] = [];
  selectedBookIds: Set<number> = new Set();

  @Output() selectedBooksChange = new EventEmitter<Set<number>>();
  @Input() books: Book[] = [];

  constructor(private bookService: BookService, private dialogService: DialogService, private zone: NgZone) {
  }

  clearSelectedBooks(): void {
    this.selectedBookIds.clear();
    this.selectedBooks = [];
    this.selectedBooksChange.emit(this.selectedBookIds);
  }

  onRowSelect(event: any): void {
    this.selectedBookIds.add(event.data.id);
    this.selectedBooksChange.emit(this.selectedBookIds);
  }

  onRowUnselect(event: any): void {
    this.selectedBookIds.delete(event.data.id);
    this.selectedBooksChange.emit(this.selectedBookIds);
  }

  onHeaderCheckboxToggle(event: any): void {
    if (event.checked) {
      this.selectedBooks = [...this.books];
      this.selectedBookIds = new Set(this.books.map(book => book.id));
    } else {
      this.clearSelectedBooks();
    }
    this.selectedBooksChange.emit(this.selectedBookIds);
  }

  getBookCoverUrl(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }

  openMetadataCenter(id: number): void {
    this.openBookDetailsDialog(id);
  }

  openBookDetailsDialog(bookId: number): void {
    this.bookService.getBookByIdFromAPI(bookId, true).subscribe({
      next: (book) => {
        this.dialogService.open(BookMetadataCenterComponent, {
          header: 'Open book details',
          modal: true,
          closable: true,
          width: '1200px',
          height: '835px',
          showHeader: false,
          closeOnEscape: true,
          dismissableMask: true,
          data: {
            book: book
          }
        });
      },
      error: (error) => {
        console.error('Error fetching book:', error);
      }
    });
  }
}

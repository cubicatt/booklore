import {Component, EventEmitter, inject, Input, OnChanges, Output} from '@angular/core';
import {TableModule} from 'primeng/table';
import {NgIf} from '@angular/common';
import {BookService} from '../../../service/book.service';
import {Rating} from 'primeng/rating';
import {FormsModule} from '@angular/forms';
import {BookMetadataCenterComponent} from '../../../../metadata/book-metadata-center/book-metadata-center.component';
import {DialogService} from 'primeng/dynamicdialog';
import {Book} from '../../../model/book.model';
import {SortOption} from '../../../model/sort.model';
import {MetadataDialogService} from '../../../../metadata/service/metadata-dialog.service';
import {API_CONFIG} from '../../../../config/api-config';

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
export class BookTableComponent implements OnChanges {
  selectedBooks: Book[] = [];
  selectedBookIds = new Set<number>();

  @Output() selectedBooksChange = new EventEmitter<Set<number>>();
  @Input() books: Book[] = [];
  @Input() sortOption: SortOption | null = null;

  private bookService = inject(BookService);
  private metadataDialogService = inject(MetadataDialogService);
  baseUrl = API_CONFIG.BASE_URL;


  // Hack to set virtual-scroller height

  ngOnChanges() {
    const wrapperElements: HTMLCollection = document.getElementsByClassName('p-virtualscroller');
    Array.prototype.forEach.call(wrapperElements, function (wrapperElement) {
      wrapperElement.style["height"] = 'calc(100vh - 160px)';
    });
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
    this.metadataDialogService.openBookMetadataCenterDialog(id, 'view');
  }

  getStarColor(rating: number): string {
    if (rating >= 4.5) {
      return 'rgb(34, 197, 94)';
    } else if (rating >= 4) {
      return 'rgb(52, 211, 153)';
    } else if (rating >= 3.5) {
      return 'rgb(234, 179, 8)';
    } else if (rating >= 2.5) {
      return 'rgb(249, 115, 22)';
    } else {
      return 'rgb(239, 68, 68)';
    }
  }
}

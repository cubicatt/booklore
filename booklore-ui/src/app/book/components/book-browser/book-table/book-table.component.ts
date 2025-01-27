import {Component, EventEmitter, inject, Input, OnChanges, Output} from '@angular/core';
import {TableEditCompleteEvent, TableModule} from 'primeng/table';
import {NgIf} from '@angular/common';
import {Rating} from 'primeng/rating';
import {FormsModule} from '@angular/forms';
import {Book} from '../../../model/book.model';
import {SortOption} from '../../../model/sort.model';
import {MetadataDialogService} from '../../../../metadata/service/metadata-dialog.service';
import {UrlHelperService} from '../../../../utilities/service/url-helper.service';
import {InputText} from 'primeng/inputtext';
import {MetadataService} from '../../../../metadata/service/metadata.service';

@Component({
  selector: 'app-book-table',
  standalone: true,
  templateUrl: './book-table.component.html',
  imports: [
    TableModule,
    NgIf,
    Rating,
    FormsModule,
    InputText
  ],
  styleUrl: './book-table.component.scss'
})
export class BookTableComponent implements OnChanges {
  selectedBooks: Book[] = [];
  selectedBookIds = new Set<number>();

  @Output() selectedBooksChange = new EventEmitter<Set<number>>();
  @Input() books: Book[] = [];
  @Input() sortOption: SortOption | null = null;

  protected urlHelper = inject(UrlHelperService);
  private metadataDialogService = inject(MetadataDialogService);
  private metadataService = inject(MetadataService)

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

  onEditComplete($event: TableEditCompleteEvent) {
    const field = $event.field?.replace(/^metadata\./, '');
    this.metadataService.updateMetadataField($event.index, field, $event.data).subscribe();
  }

  removeAuthor(authorToRemove: { name: string }) {
    /*const authors = this.books[0].metadata.authors; // Adjust this to get the correct book metadata
    const index = authors.findIndex(author => author.name === authorToRemove.name);
    if (index !== -1) {
      authors.splice(index, 1); // Remove the author from the array
    }*/
  }

  getAuthorNames(authors: string[]): string {
    return authors?.join(', ') || '';
  }

  getGenres(genres: string[]) {
    return genres?.join(', ') || '';
  }
}

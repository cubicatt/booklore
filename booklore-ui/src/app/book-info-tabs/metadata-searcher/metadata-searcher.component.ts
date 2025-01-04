import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FetchedMetadata} from '../../book/model/book.model';
import {BookService} from '../../book/service/book.service';
import {MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {NgIf} from '@angular/common';
import {Divider} from 'primeng/divider';
import {BookInfoService} from '../book-info.service';
import {Observable} from 'rxjs';
import {BookMetadataBI} from '../../book/model/book-metadata-for-book-info.model';

@Component({
  selector: 'app-metadata-searcher',
  standalone: true,
  templateUrl: './metadata-searcher.component.html',
  styleUrls: ['./metadata-searcher.component.scss'],
  imports: [
    Button,
    FormsModule,
    InputText,
    NgIf,
    Divider,
    ReactiveFormsModule
  ]
})
export class MetadataSearcherComponent implements OnInit {

  @Input() fetchedMetadata!: FetchedMetadata;
  @Output() goBack = new EventEmitter<boolean>();

  bookMetadataForm: FormGroup;
  bookMetadata$: Observable<BookMetadataBI | null>;
  currentBookId!: number;
  updateThumbnailUrl: boolean = false;

  constructor(private bookService: BookService, private bookInfoService: BookInfoService, private messageService: MessageService) {
    this.bookMetadata$ = this.bookInfoService.bookMetadata$;
    this.bookMetadataForm = new FormGroup({
      title: new FormControl(''),
      subtitle: new FormControl(''),
      authors: new FormControl(''),
      categories: new FormControl(''),
      publisher: new FormControl(''),
      publishedDate: new FormControl(''),
      isbn10: new FormControl(''),
      isbn13: new FormControl(''),
      asin: new FormControl(''),
      description: new FormControl(''),
      pageCount: new FormControl(''),
      language: new FormControl(''),
    });
  }

  ngOnInit(): void {
    this.bookMetadata$.subscribe((bookMetadata) => {
      if (bookMetadata) {
        this.currentBookId = bookMetadata.bookId;
        this.bookMetadataForm.setValue({
          title: bookMetadata.title,
          subtitle: bookMetadata.subtitle,
          authors: bookMetadata.authors.join(', '),
          categories: bookMetadata.categories.join(', '),
          publisher: bookMetadata.publisher,
          publishedDate: bookMetadata.publishedDate,
          isbn10: bookMetadata.isbn10,
          isbn13: bookMetadata.isbn13,
          asin: bookMetadata.asin ?  bookMetadata.asin : null,
          description: bookMetadata.description,
          pageCount: bookMetadata.pageCount == 0 ? null : bookMetadata.pageCount,
          language: bookMetadata.language
        });
      }
    });
  }

  fetchedAuthorsString(): string {
    return this.fetchedMetadata.authors ? this.fetchedMetadata.authors.map(author => author).join(', ') : '';
  }

  fetchedCategoriesString(): string {
    return this.fetchedMetadata.categories ? this.fetchedMetadata.categories.map(category => category).join(', ') : '';
  }

  coverImageSrc(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }

  onSave(): void {
    const updatedBookMetadata: BookMetadataBI = {
      bookId: this.currentBookId,
      title: this.bookMetadataForm.get('title')?.value || this.fetchedMetadata.title,
      subtitle: this.bookMetadataForm.get('subtitle')?.value || this.fetchedMetadata.subtitle,
      authors: this.getArrayFromFormField('authors', this.fetchedMetadata.authors),
      categories: this.getArrayFromFormField('categories', this.fetchedMetadata.categories),
      publisher: this.bookMetadataForm.get('publisher')?.value || this.fetchedMetadata.publisher,
      publishedDate: this.bookMetadataForm.get('publishedDate')?.value || this.fetchedMetadata.publishedDate,
      isbn10: this.bookMetadataForm.get('isbn10')?.value || this.fetchedMetadata.isbn10,
      isbn13: this.bookMetadataForm.get('isbn13')?.value || this.fetchedMetadata.isbn13,
      asin: this.bookMetadataForm.get('asin')?.value || this.fetchedMetadata.asin,
      description: this.bookMetadataForm.get('description')?.value || this.fetchedMetadata.description,
      pageCount: this.bookMetadataForm.get('pageCount')?.value || this.fetchedMetadata.pageCount,
      language: this.bookMetadataForm.get('language')?.value || this.fetchedMetadata.language,
      thumbnailUrl: this.updateThumbnailUrl ? this.fetchedMetadata.thumbnailUrl : undefined
    };
    this.bookService.updateMetadata(updatedBookMetadata.bookId, updatedBookMetadata).subscribe({
      next: () => {
        this.messageService.add({severity: 'info', summary: 'Success', detail: 'Book metadata updated'});
        this.bookInfoService.emit(updatedBookMetadata);
      },
      error: (error) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update book metadata'});
      }
    });
  }

  private getArrayFromFormField(field: string, fallbackValue: string[]): string[] {
    const fieldValue = this.bookMetadataForm.get(field)?.value;
    if (fieldValue) {
      return String(fieldValue).split(',').map((item: string) => item.trim());
    }
    return fallbackValue || [];
  }

  shouldUpdateThumbnail() {
    this.updateThumbnailUrl = true;
  }

  copyFetchedToCurrent(field: string): void {
    const value = this.fetchedMetadata[field];
    if (value) {
      this.bookMetadataForm.get(field)?.setValue(value);
    }
  }

  goBackClick() {
    this.goBack.emit(true);
  }
}

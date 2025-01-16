import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {Book, BookMetadata, FetchedMetadata} from '../../../book/model/book.model';
import {BookService} from '../../../book/service/book.service';
import {MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {NgClass, NgIf, NgStyle} from '@angular/common';
import {Divider} from 'primeng/divider';
import {BookMetadataCenterService} from '../book-metadata-center.service';
import {Observable} from 'rxjs';
import {Tooltip} from 'primeng/tooltip';
import {MetadataService} from '../../service/metadata.service';

@Component({
  selector: 'app-metadata-picker',
  standalone: true,
  templateUrl: './metadata-picker.component.html',
  styleUrls: ['./metadata-picker.component.scss'],
  imports: [
    Button,
    FormsModule,
    InputText,
    NgIf,
    Divider,
    ReactiveFormsModule,
    NgClass,
    NgStyle,
    Tooltip
  ]
})
export class MetadataPickerComponent implements OnInit {

  @Input() fetchedMetadata!: FetchedMetadata;
  @Output() goBack = new EventEmitter<boolean>();

  bookMetadataForm: FormGroup;
  currentBookId!: number;
  updateThumbnailUrl: boolean = false;
  thumbnailSaved: boolean = false;
  copiedFields: Record<string, boolean> = {};
  savedFields: Record<string, boolean> = {};

  private bookService = inject(BookService);
  private metadataCenterService = inject(BookMetadataCenterService);
  private messageService = inject(MessageService);
  private metadataService = inject(MetadataService);

  metadata$: Observable<BookMetadata | null> = this.metadataCenterService.bookMetadata$;

  constructor() {
    this.bookMetadataForm = new FormGroup({
      title: new FormControl(''),
      subtitle: new FormControl(''),
      authors: new FormControl(''),
      categories: new FormControl(''),
      publisher: new FormControl(''),
      publishedDate: new FormControl(''),
      isbn10: new FormControl(''),
      isbn13: new FormControl(''),
      description: new FormControl(''),
      pageCount: new FormControl(''),
      language: new FormControl(''),
      rating: new FormControl(''),
      reviewCount: new FormControl(''),
    });
  }

  ngOnInit(): void {
    this.metadata$.subscribe((metadata) => {
      if (metadata) {
        this.currentBookId = metadata.bookId;
        this.bookMetadataForm.setValue({
          title: metadata.title,
          subtitle: metadata.subtitle,
          authors: metadata.authors.map((author) => author.name).join(', '),
          categories: metadata.categories.map((category) => category.name).join(', '),
          publisher: metadata.publisher,
          publishedDate: metadata.publishedDate,
          isbn10: metadata.isbn10,
          isbn13: metadata.isbn13,
          description: metadata.description,
          pageCount: metadata.pageCount == 0 ? null : metadata.pageCount,
          language: metadata.language,
          rating: metadata.rating,
          reviewCount: metadata.reviewCount
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
    const updatedBookMetadata: BookMetadata = {
      bookId: this.currentBookId,
      title: this.bookMetadataForm.get('title')?.value || this.copiedFields['title'] ? this.getValueOrCopied('title') : '',
      subtitle: this.bookMetadataForm.get('subtitle')?.value || this.copiedFields['subtitle'] ? this.getValueOrCopied('subtitle') : '',
      authors: this.bookMetadataForm.get('authors')?.value || this.copiedFields['authors'] ? this.getArrayFromFormField('authors', this.fetchedMetadata.authors) : [],
      categories: this.bookMetadataForm.get('categories')?.value || this.copiedFields['categories'] ? this.getArrayFromFormField('categories', this.fetchedMetadata.categories) : [],
      publisher: this.bookMetadataForm.get('publisher')?.value || this.copiedFields['publisher'] ? this.getValueOrCopied('publisher') : '',
      publishedDate: this.bookMetadataForm.get('publishedDate')?.value || this.copiedFields['publishedDate'] ? this.getValueOrCopied('publishedDate') : '',
      isbn10: this.bookMetadataForm.get('isbn10')?.value || this.copiedFields['isbn10'] ? this.getValueOrCopied('isbn10') : '',
      isbn13: this.bookMetadataForm.get('isbn13')?.value || this.copiedFields['isbn13'] ? this.getValueOrCopied('isbn13') : '',
      description: this.bookMetadataForm.get('description')?.value || this.copiedFields['description'] ? this.getValueOrCopied('description') : '',
      pageCount: this.bookMetadataForm.get('pageCount')?.value || this.copiedFields['pageCount'] ? this.getPageCountOrCopied() : null,
      language: this.bookMetadataForm.get('language')?.value || this.copiedFields['language'] ? this.getValueOrCopied('language') : '',
      rating: this.bookMetadataForm.get('rating')?.value || this.copiedFields['rating'] ? this.getNumberOrCopied('rating') : null,
      reviewCount: this.bookMetadataForm.get('reviewCount')?.value || this.copiedFields['reviewCount'] ? this.getNumberOrCopied('reviewCount') : null,
      thumbnailUrl: this.updateThumbnailUrl ? this.fetchedMetadata.thumbnailUrl : '',
    };

    this.metadataService.updateBookMetadata(this.currentBookId, updatedBookMetadata).subscribe({
      next: () => {
        Object.keys(this.copiedFields).forEach((field) => {
          if (this.copiedFields[field]) {
            this.savedFields[field] = true;
          }
        });
        if (this.updateThumbnailUrl) {
          this.thumbnailSaved = true;
        }
        this.messageService.add({severity: 'info', summary: 'Success', detail: 'Book metadata updated'});
        this.metadataCenterService.emit(updatedBookMetadata);
      },
      error: () => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update book metadata'});
      }
    });
  }

  copyMissing() {
    Object.keys(this.fetchedMetadata).forEach((field) => {
      if (!this.bookMetadataForm.get(field)?.value && this.fetchedMetadata[field]) {
        this.copyFetchedToCurrent(field);
      }
    });
  }

  private getNumberOrCopied(field: string): number | null {
    const formValue = this.bookMetadataForm.get(field)?.value;
    if (formValue === '' || formValue === null || isNaN(formValue)) {
      this.copiedFields[field] = true;
      return this.fetchedMetadata[field] || null;
    }
    return Number(formValue);
  }

  private getPageCountOrCopied(): number | null {
    const formValue = this.bookMetadataForm.get('pageCount')?.value;
    if (formValue === '' || formValue === null || isNaN(formValue)) {
      this.copiedFields['pageCount'] = true;
      return this.fetchedMetadata.pageCount || null;
    }
    return Number(formValue);
  }

  private getValueOrCopied(field: string): string {
    const formValue = this.bookMetadataForm.get(field)?.value;
    if (!formValue || formValue === '') {
      this.copiedFields[field] = true;
      return this.fetchedMetadata[field] || '';
    }
    return formValue;
  }

  getArrayFromFormField(field: string, fallbackValue: any): any[] {
    const fieldValue = this.bookMetadataForm.get(field)?.value;
    if (!fieldValue) {
      return fallbackValue ? (Array.isArray(fallbackValue) ? fallbackValue : [fallbackValue]) : [];
    }
    if (typeof fieldValue === 'string') {
      return fieldValue.split(',').map(item => item.trim());
    }
    return Array.isArray(fieldValue) ? fieldValue : [];
  }

  shouldUpdateThumbnail() {
    this.updateThumbnailUrl = true;
  }

  copyFetchedToCurrent(field: string): void {
    const value = this.fetchedMetadata[field];
    if (value) {
      this.bookMetadataForm.get(field)?.setValue(value);
      this.copiedFields[field] = true;
      this.highlightCopiedInput(field);
    }
  }

  highlightCopiedInput(field: string): void {
    this.copiedFields = {...this.copiedFields, [field]: true};
  }

  isValueCopied(field: string): boolean {
    return this.copiedFields[field];
  }

  isValueSaved(field: string): boolean {
    return this.savedFields[field];
  }

  goBackClick() {
    this.goBack.emit(true);
  }

  closeDialog() {
    this.metadataCenterService.closeDialog(true);
  }

}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FetchedMetadata } from '../../book/model/book.model';
import { BookService } from '../../book/service/book.service';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import {NgClass, NgIf} from '@angular/common';
import { Divider } from 'primeng/divider';
import { BookInfoService } from '../book-info.service';
import { Observable } from 'rxjs';
import { BookMetadataBI } from '../../book/model/book-metadata-for-book-info.model';

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
    ReactiveFormsModule,
    NgClass
  ]
})
export class MetadataSearcherComponent implements OnInit {

  @Input() fetchedMetadata!: FetchedMetadata;
  @Output() goBack = new EventEmitter<boolean>();

  bookMetadataForm: FormGroup;
  bookMetadata$: Observable<BookMetadataBI | null>;
  currentBookId!: number;
  updateThumbnailUrl: boolean = false;
  copiedFields: { [key: string]: boolean } = {};

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
      title: this.getValueOrCopied('title'),
      subtitle: this.getValueOrCopied('subtitle'),
      authors: this.getArrayFromFormField('authors', this.fetchedMetadata.authors),
      categories: this.getArrayFromFormField('categories', this.fetchedMetadata.categories),
      publisher: this.getValueOrCopied('publisher'),
      publishedDate: this.getValueOrCopied('publishedDate'),
      isbn10: this.getValueOrCopied('isbn10'),
      isbn13: this.getValueOrCopied('isbn13'),
      asin: this.getValueOrCopied('asin'),
      description: this.getValueOrCopied('description'),
      pageCount: this.getPageCountOrCopied(),
      language: this.getValueOrCopied('language'),
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
      this.highlightCopiedInput(field);
    }
  }

  highlightCopiedInput(field: string): void {
    this.copiedFields = { ...this.copiedFields, [field]: true };
  }

  isValueCopied(field: string): boolean {
    return this.copiedFields[field];
  }

  goBackClick() {
    this.goBack.emit(true);
  }
}

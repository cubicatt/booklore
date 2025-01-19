import {Component, inject, OnInit} from '@angular/core';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {Image} from 'primeng/image';
import {Button} from 'primeng/button';
import {Divider} from 'primeng/divider';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Observable} from 'rxjs';
import {BookMetadataCenterService} from '../book-metadata-center.service';
import {AsyncPipe, NgIf} from '@angular/common';
import {BookService} from '../../../book/service/book.service';
import {MessageService} from 'primeng/api';
import {MetadataService} from '../../service/metadata.service';
import {Book, BookMetadata} from '../../../book/model/book.model';
import {API_CONFIG} from '../../../config/api-config';

@Component({
  selector: 'app-metadata-editor',
  standalone: true,
  templateUrl: './metadata-editor.component.html',
  styleUrl: './metadata-editor.component.scss',
  imports: [
    InputText,
    Textarea,
    Button,
    Divider,
    FormsModule,
    AsyncPipe,
    NgIf,
    ReactiveFormsModule
  ]
})
export class MetadataEditorComponent implements OnInit {

  private metadataCenterService = inject(BookMetadataCenterService);
  private bookService = inject(BookService);
  private messageService = inject(MessageService);
  private metadataService = inject(MetadataService);

  bookMetadata$: Observable<BookMetadata | null> = this.metadataCenterService.currentMetadata$;
  bookMetadataForm: FormGroup;
  currentBookId!: number;
  baseUrl = API_CONFIG.BASE_URL;

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
    this.bookMetadata$.subscribe((metadata) => {
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

  onSave(): void {
    const updatedBookMetadata: BookMetadata = {
      bookId: this.currentBookId,
      title: this.bookMetadataForm.get('title')?.value,
      subtitle: this.bookMetadataForm.get('subtitle')?.value,
      authors: this.bookMetadataForm.get('authors')?.value.split(',').map((author: string) => author.trim()),
      categories: this.bookMetadataForm.get('categories')?.value.split(',').map((category: string) => category.trim()),
      publisher: this.bookMetadataForm.get('publisher')?.value,
      publishedDate: this.bookMetadataForm.get('publishedDate')?.value,
      isbn10: this.bookMetadataForm.get('isbn10')?.value,
      isbn13: this.bookMetadataForm.get('isbn13')?.value,
      description: this.bookMetadataForm.get('description')?.value,
      pageCount: this.bookMetadataForm.get('pageCount')?.value,
      rating: this.bookMetadataForm.get('rating')?.value,
      reviewCount: this.bookMetadataForm.get('reviewCount')?.value,
      language: this.bookMetadataForm.get('language')?.value
    };
    this.metadataService.updateBookMetadata(this.currentBookId, updatedBookMetadata).subscribe({
      next: () => {
        this.messageService.add({severity: 'info', summary: 'Success', detail: 'Book metadata updated'});
        this.metadataCenterService.emit(updatedBookMetadata);
      },
      error: () => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update book metadata'});
      }
    })
  }

  coverImageSrc(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }

  closeDialog() {
    this.metadataCenterService.closeDialog(true);
  }
}

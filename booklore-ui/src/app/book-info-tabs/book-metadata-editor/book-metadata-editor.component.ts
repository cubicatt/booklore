import {Component, OnInit} from '@angular/core';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {Image} from 'primeng/image';
import {Button} from 'primeng/button';
import {Divider} from 'primeng/divider';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Observable} from 'rxjs';
import {BookInfoService} from '../book-info.service';
import {AsyncPipe, NgIf} from '@angular/common';
import {BookService} from '../../book/service/book.service';
import {BookMetadataBI} from '../../book/model/book-metadata-for-book-info.model';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-book-metadata-editor',
  standalone: true,
  templateUrl: './book-metadata-editor.component.html',
  styleUrl: './book-metadata-editor.component.scss',
  imports: [
    InputText,
    Textarea,
    Image,
    Button,
    Divider,
    FormsModule,
    AsyncPipe,
    NgIf,
    ReactiveFormsModule
  ]
})
export class BookMetadataEditorComponent implements OnInit {

  bookMetadata$: Observable<BookMetadataBI | null>;
  bookMetadataForm: FormGroup;
  currentBookId!: number;

  constructor(private bookInfoService: BookInfoService, private bookService: BookService, private messageService: MessageService) {
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
      description: new FormControl(''),
      pageCount: new FormControl(''),
      language: new FormControl(''),
      rating: new FormControl(''),
      reviewCount: new FormControl(''),
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
          description: bookMetadata.description,
          pageCount: bookMetadata.pageCount == 0 ? null : bookMetadata.pageCount,
          language: bookMetadata.language,
          rating: bookMetadata.rating,
          reviewCount: bookMetadata.reviewCount
        });
      }
    });
  }

  onSave(): void {
    const updatedBookMetadata: BookMetadataBI = {
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
    this.bookService.updateMetadata(updatedBookMetadata.bookId, updatedBookMetadata).subscribe({
      next: () => {
        this.messageService.add({severity: 'info', summary: 'Success', detail: 'Book metadata updated'});
        this.bookInfoService.emit(updatedBookMetadata);
      },
      error: (error) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update book metadata'});
      }
    })
  }

  coverImageSrc(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }

  closeDialog() {
    this.bookInfoService.closeDialog(true);
  }
}

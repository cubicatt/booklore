import {Component, inject, OnInit} from '@angular/core';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {Button} from 'primeng/button';
import {Divider} from 'primeng/divider';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Observable} from 'rxjs';
import {BookMetadataCenterService} from '../book-metadata-center.service';
import {AsyncPipe, NgIf} from '@angular/common';
import {MessageService} from 'primeng/api';
import {MetadataService} from '../../service/metadata.service';
import {BookMetadata} from '../../../book/model/book.model';
import {UrlHelperService} from '../../../utilities/service/url-helper.service';

@Component({
  selector: 'app-metadata-editor',
  standalone: true,
  templateUrl: './metadata-editor.component.html',
  styleUrls: ['./metadata-editor.component.scss'],
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
  private messageService = inject(MessageService);
  private metadataService = inject(MetadataService);
  protected urlHelper = inject(UrlHelperService);

  bookMetadata$: Observable<BookMetadata | null> = this.metadataCenterService.currentMetadata$;
  bookMetadataForm: FormGroup;
  currentBookId!: number;

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
      seriesName: new FormControl(''),
      seriesNumber: new FormControl(''),
      seriesTotal: new FormControl(''),

      titleLocked: new FormControl(false),
      subtitleLocked: new FormControl(false),
      authorsLocked: new FormControl(false),
      categoriesLocked: new FormControl(false),
      publisherLocked: new FormControl(false),
      publishedDateLocked: new FormControl(false),
      isbn10Locked: new FormControl(false),
      isbn13Locked: new FormControl(false),
      descriptionLocked: new FormControl(false),
      pageCountLocked: new FormControl(false),
      languageLocked: new FormControl(false),
      ratingLocked: new FormControl(false),
      reviewCountLocked: new FormControl(false),
      seriesNameLocked: new FormControl(false),
      seriesNumberLocked: new FormControl(false),
      seriesTotalLocked: new FormControl(false),
    });
  }

  ngOnInit(): void {
    this.bookMetadata$.subscribe((metadata) => {
      if (metadata) {
        this.currentBookId = metadata.bookId;

        this.bookMetadataForm.setValue({
          title: metadata.title,
          subtitle: metadata.subtitle,
          authors: metadata.authors.map((author) => author.name).sort().join(', '),
          categories: metadata.categories.map((category) => category.name).sort().join(', '),
          publisher: metadata.publisher,
          publishedDate: metadata.publishedDate,
          isbn10: metadata.isbn10,
          isbn13: metadata.isbn13,
          description: metadata.description,
          pageCount: metadata.pageCount == 0 ? null : metadata.pageCount,
          language: metadata.language,
          rating: metadata.rating,
          reviewCount: metadata.reviewCount,
          seriesName: metadata.seriesName,
          seriesNumber: metadata.seriesNumber,
          seriesTotal: metadata.seriesTotal,

          titleLocked: metadata.titleLocked || false,
          subtitleLocked: metadata.subtitleLocked || false,
          authorsLocked: metadata.authorsLocked || false,
          categoriesLocked: metadata.categoriesLocked || false,
          publisherLocked: metadata.publisherLocked || false,
          publishedDateLocked: metadata.publishedDateLocked || false,
          isbn10Locked: metadata.isbn10Locked || false,
          isbn13Locked: metadata.isbn13Locked || false,
          descriptionLocked: metadata.descriptionLocked || false,
          pageCountLocked: metadata.pageCountLocked || false,
          languageLocked: metadata.languageLocked || false,
          ratingLocked: metadata.ratingLocked || false,
          reviewCountLocked: metadata.reviewCountLocked || false,
          seriesNameLocked: metadata.seriesNameLocked || false,
          seriesNumberLocked: metadata.seriesNumberLocked || false,
          seriesTotalLocked: metadata.seriesTotalLocked || false,
        });

        if (metadata.titleLocked) this.bookMetadataForm.get('title')?.disable();
        if (metadata.subtitleLocked) this.bookMetadataForm.get('subtitle')?.disable();
        if (metadata.authorsLocked) this.bookMetadataForm.get('authors')?.disable();
        if (metadata.categoriesLocked) this.bookMetadataForm.get('categories')?.disable();
        if (metadata.publisherLocked) this.bookMetadataForm.get('publisher')?.disable();
        if (metadata.publishedDateLocked) this.bookMetadataForm.get('publishedDate')?.disable();
        if (metadata.languageLocked) this.bookMetadataForm.get('language')?.disable();
        if (metadata.isbn10Locked) this.bookMetadataForm.get('isbn10')?.disable();
        if (metadata.isbn13Locked) this.bookMetadataForm.get('isbn13')?.disable();
        if (metadata.reviewCountLocked) this.bookMetadataForm.get('reviewCount')?.disable();
        if (metadata.ratingLocked) this.bookMetadataForm.get('rating')?.disable();
        if (metadata.pageCountLocked) this.bookMetadataForm.get('pageCount')?.disable();
        if (metadata.descriptionLocked) this.bookMetadataForm.get('description')?.disable();
        if (metadata.seriesNameLocked) this.bookMetadataForm.get('seriesName')?.disable();
        if (metadata.seriesNumberLocked) this.bookMetadataForm.get('seriesNumber')?.disable();
        if (metadata.seriesTotalLocked) this.bookMetadataForm.get('seriesTotal')?.disable();
      }
    });
  }

  onSave(): void {
    this.metadataService.updateBookMetadata(this.currentBookId, this.buildMetadata()).subscribe({
      next: (response) => {
        this.messageService.add({severity: 'info', summary: 'Success', detail: 'Book metadata updated'});
        this.metadataCenterService.emit(response);
      },
      error: () => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update book metadata'});
      }
    });
  }

  toggleLock(field: string): void {
    const isLocked = this.bookMetadataForm.get(field + 'Locked')?.value;
    const updatedLockedState = !isLocked;
    this.bookMetadataForm.get(field + 'Locked')?.setValue(updatedLockedState);
    if (updatedLockedState) {
      this.bookMetadataForm.get(field)?.disable();
    } else {
      this.bookMetadataForm.get(field)?.enable();
    }
    this.updateMetadata();
  }

  lockAll(): void {
    Object.keys(this.bookMetadataForm.controls).forEach((key) => {
      if (key.endsWith('Locked')) {
        this.bookMetadataForm.get(key)?.setValue(true);
        const fieldName = key.replace('Locked', '');
        this.bookMetadataForm.get(fieldName)?.disable();
      }
    });
    this.updateMetadata();
  }

  unlockAll(): void {
    Object.keys(this.bookMetadataForm.controls).forEach((key) => {
      if (key.endsWith('Locked')) {
        this.bookMetadataForm.get(key)?.setValue(false);
        const fieldName = key.replace('Locked', '');
        this.bookMetadataForm.get(fieldName)?.enable();
      }
    });
    this.updateMetadata();
  }

  private buildMetadata() {
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
      language: this.bookMetadataForm.get('language')?.value,
      seriesName: this.bookMetadataForm.get('seriesName')?.value,
      seriesNumber: this.bookMetadataForm.get('seriesNumber')?.value,
      seriesTotal: this.bookMetadataForm.get('seriesTotal')?.value,

      titleLocked: this.bookMetadataForm.get('titleLocked')?.value,
      subtitleLocked: this.bookMetadataForm.get('subtitleLocked')?.value,
      authorsLocked: this.bookMetadataForm.get('authorsLocked')?.value,
      categoriesLocked: this.bookMetadataForm.get('categoriesLocked')?.value,
      publisherLocked: this.bookMetadataForm.get('publisherLocked')?.value,
      publishedDateLocked: this.bookMetadataForm.get('publishedDateLocked')?.value,
      isbn10Locked: this.bookMetadataForm.get('isbn10Locked')?.value,
      isbn13Locked: this.bookMetadataForm.get('isbn13Locked')?.value,
      descriptionLocked: this.bookMetadataForm.get('descriptionLocked')?.value,
      pageCountLocked: this.bookMetadataForm.get('pageCountLocked')?.value,
      languageLocked: this.bookMetadataForm.get('languageLocked')?.value,
      ratingLocked: this.bookMetadataForm.get('ratingLocked')?.value,
      reviewCountLocked: this.bookMetadataForm.get('reviewCountLocked')?.value,
      seriesNameLocked: this.bookMetadataForm.get('seriesNameLocked')?.value,
      seriesNumberLocked: this.bookMetadataForm.get('seriesNumberLocked')?.value,
      seriesTotalLocked: this.bookMetadataForm.get('seriesTotalLocked')?.value,

    };
    return updatedBookMetadata;
  }

  private updateMetadata(): void {
    this.metadataService.updateBookMetadata(this.currentBookId, this.buildMetadata()).subscribe({
      next: (response) => {
        this.metadataCenterService.emit(response);
      },
      error: () => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update lock state'});
      }
    });
  }

  closeDialog() {
    this.metadataCenterService.closeDialog(true);
  }
}

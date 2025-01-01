import {Component} from '@angular/core';
import {Book, FetchedMetadata, UpdateMedata} from '../book/model/book.model';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {BookService} from '../book/service/book.service';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-metadata-searcher',
  standalone: false,
  templateUrl: './metadata-searcher.component.html',
  styleUrls: ['./metadata-searcher.component.scss']
})
export class MetadataSearcherComponent {

  fetchedMetadata: FetchedMetadata;
  toUpdateMetadata: UpdateMedata;
  book: Book;
  loading: boolean = false;
  updateThumbnail: boolean = false;

  constructor(public dynamicDialogConfig: DynamicDialogConfig, private dynamicDialogRef: DynamicDialogRef,
              private bookService: BookService, private messageService: MessageService) {


    this.fetchedMetadata = this.dynamicDialogConfig.data.fetchedMetadata;
    this.toUpdateMetadata = JSON.parse(JSON.stringify(this.dynamicDialogConfig.data.currentMetadata));
    this.book = this.dynamicDialogConfig.data.book;
  }

  copyFetchedToCurrent(field: keyof UpdateMedata) {
    if (this.fetchedMetadata && this.toUpdateMetadata) {
      this.toUpdateMetadata[field] = this.fetchedMetadata[field];
    }
  }

  get currentAuthorsString(): string {
    return this.toUpdateMetadata.authors ? this.toUpdateMetadata.authors.map(author => author.name).join(', ') : '';
  }

  set currentAuthorsString(value: string) {
    this.toUpdateMetadata.authors = value.split(',').map(name => ({
      id: this.toUpdateMetadata.authors?.find(author => author.name.trim() === name.trim())?.id || 0,
      name: name.trim()
    }));
  }

  get fetchedAuthorsString(): string {
    return this.fetchedMetadata.authors ? this.fetchedMetadata.authors.map(author => author.name).join(', ') : '';
  }

  set fetchedAuthorsString(value: string) {
    this.fetchedMetadata.authors = value.split(',').map(name => ({
      id: this.fetchedMetadata.authors?.find(author => author.name.trim() === name.trim())?.id || 0,
      name: name.trim()
    }));
  }

  get currentCategoriesString(): string {
    return this.toUpdateMetadata.categories ? this.toUpdateMetadata.categories.map(category => category.name).join(', ') : '';
  }

  set currentCategoriesString(value: string) {
    this.toUpdateMetadata.categories = value.split(',').map(name => ({
      id: this.toUpdateMetadata.categories?.find(category => category.name.trim() === name.trim())?.id || 0,
      name: name.trim()
    }));
  }

  get fetchedCategoriesString(): string {
    return this.fetchedMetadata.categories ? this.fetchedMetadata.categories.map(category => category.name).join(', ') : '';
  }

  set fetchedCategoriesString(value: string) {
    this.fetchedMetadata.categories = value.split(',').map(name => ({
      id: this.fetchedMetadata.categories?.find(category => category.name.trim() === name.trim())?.id || 0,
      name: name.trim()
    }));
  }

  closeDialog() {
    this.dynamicDialogRef.close();
  }

  coverImageSrc(book: Book): string {
    return this.bookService.getBookCoverUrl(book.id);
  }

  saveMetadata() {
    this.loading = true;
    this.updateFields();
    this.bookService.updateMetadata(this.book.id, this.toUpdateMetadata).subscribe({
      next: () => {
        this.messageService.add({severity: 'info', summary: 'Success', detail: 'Book metadata updated'});
        this.loading = false;
        this.dynamicDialogRef.close();
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update book metadata'});
      }
    });
  }

  updateFields() {
    if (!this.toUpdateMetadata.title && this.fetchedMetadata.title) {
      this.toUpdateMetadata.title = this.fetchedMetadata.title;
    }

    if (!this.toUpdateMetadata.subtitle && this.fetchedMetadata.subtitle) {
      this.toUpdateMetadata.subtitle = this.fetchedMetadata.subtitle;
    }

    if (!this.toUpdateMetadata.publisher && this.fetchedMetadata.publisher) {
      this.toUpdateMetadata.publisher = this.fetchedMetadata.publisher;
    }

    if (!this.toUpdateMetadata.publishedDate && this.fetchedMetadata.publishedDate) {
      this.toUpdateMetadata.publishedDate = this.fetchedMetadata.publishedDate;
    }

    if (!this.toUpdateMetadata.description && this.fetchedMetadata.description) {
      this.toUpdateMetadata.description = this.fetchedMetadata.description;
    }

    if (!this.toUpdateMetadata.isbn10 && this.fetchedMetadata.isbn10) {
      this.toUpdateMetadata.isbn10 = this.fetchedMetadata.isbn10;
    }

    if (!this.toUpdateMetadata.language && this.fetchedMetadata.language) {
      this.toUpdateMetadata.language = this.fetchedMetadata.language;
    }

    if (!this.toUpdateMetadata.pageCount && this.fetchedMetadata.pageCount) {
      this.toUpdateMetadata.pageCount = this.fetchedMetadata.pageCount;
    }

    if (!this.toUpdateMetadata.authors || this.toUpdateMetadata.authors.length === 0) {
      this.toUpdateMetadata.authors = this.fetchedMetadata.authors;
    }

    if (!this.toUpdateMetadata.categories || this.toUpdateMetadata.categories.length === 0) {
      this.toUpdateMetadata.categories = this.fetchedMetadata.categories;
    }

    if(this.updateThumbnail) {
      this.toUpdateMetadata.thumbnail = this.fetchedMetadata.thumbnail;
    }
  }

  shouldUpdateThumbnail() {
    this.updateThumbnail = true;
  }
}

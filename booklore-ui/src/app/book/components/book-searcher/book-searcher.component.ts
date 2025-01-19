import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {Author, Book} from '../../model/book.model';
import {FormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {BookService} from '../../service/book.service';
import {Button} from 'primeng/button';
import {NgForOf, NgIf, SlicePipe} from '@angular/common';
import {MetadataDialogService} from '../../../metadata/service/metadata-dialog.service';
import {Divider} from 'primeng/divider';
import {API_CONFIG} from '../../../config/api-config';

@Component({
  selector: 'app-book-searcher',
  templateUrl: './book-searcher.component.html',
  imports: [
    FormsModule,
    InputTextModule,
    Button,
    NgIf,
    NgForOf,
    SlicePipe,
    Divider
  ],
  styleUrls: ['./book-searcher.component.scss'],
  standalone: true
})
export class BookSearcherComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  books: Book[] = [];
  #searchSubject = new Subject<string>();
  #subscription!: Subscription;

  private bookService = inject(BookService);
  private metadataDialogService = inject(MetadataDialogService);
  baseUrl = API_CONFIG.BASE_URL;


  ngOnInit(): void {
    this.initializeSearch();
  }

  initializeSearch(): void {
    this.#subscription = this.#searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap((query) => this.bookService.searchBooks(query).pipe(
        catchError((error) => {
          console.error('Error while searching books:', error);
          return [];
        })
      ))
    ).subscribe({
      next: (result: Book[]) => this.books = result,
      error: (error) => console.error('Subscription error:', error)
    });
  }

  getLibraryName(libraryId: number): string {
    return `${libraryId}`;
  }

  getAuthorNames(authors: Author[] | undefined): string {
    return authors?.map(author => author.name).join(', ') || 'Unknown Author';
  }

  onSearchInputChange(): void {
    this.#searchSubject.next(this.searchQuery.trim());
  }

  onBookClick(book: Book): void {
    this.clearSearch();
    this.metadataDialogService.openBookMetadataCenterDialog(book.id, 'view');
  }

  getBookCoverUrl(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.books = [];
  }

  ngOnDestroy(): void {
    if (this.#subscription) {
      this.#subscription.unsubscribe();
    }
  }
}

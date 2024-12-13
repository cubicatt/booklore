import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Book } from '../../model/book.model';
import { BookService } from '../../service/book.service';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { NgForOf, NgIf } from '@angular/common';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  imports: [
    FormsModule,
    InputTextModule,
    NgForOf,
    NgIf,
    ButtonDirective
  ],
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  books: Book[] = [];
  #searchSubject = new Subject<string>();
  #subscription!: Subscription;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.initializeSearch();
  }

  initializeSearch(): void {
    this.#subscription = this.#searchSubject.pipe(
      debounceTime(500),
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

  onSearchInputChange(): void {
    this.#searchSubject.next(this.searchQuery.trim());
  }

  onBookClick(book: Book): void {
    this.clearSearch();
    this.openBook(book.id);
  }

  openBook(bookId: number): void {
    const url = `/pdf-viewer/book/${bookId}`;
    window.open(url, '_blank');
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

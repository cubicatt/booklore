import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Book } from '../../model/book.model';
import { BookService } from '../../service/book.service';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { NgForOf, NgIf } from '@angular/common';
import { ButtonDirective } from 'primeng/button';
import {Router} from '@angular/router';

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

  constructor(private bookService: BookService, private router: Router) {}

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

  onSearchInputChange(): void {
    this.#searchSubject.next(this.searchQuery.trim());
  }

  onBookClick(book: Book): void {
    this.clearSearch();
    this.openBook(book.id, book.libraryId);
  }

  openBook(bookId: number, libraryId: number): void {
    /*const url = `/pdf-viewer/book/${bookId}`;
    window.open(url, '_blank');*/
    this.router.navigate(['/library', libraryId, 'book', bookId, 'info']);
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

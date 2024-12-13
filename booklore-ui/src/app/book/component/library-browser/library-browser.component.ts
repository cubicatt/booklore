import { Component, OnInit } from '@angular/core';
import { BookService } from '../../service/book.service';
import { Book } from '../../model/book.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-library-browser-v2',
  standalone: false,
  templateUrl: './library-browser.component.html',
  styleUrls: ['./library-browser.component.scss'],
})
export class LibraryBrowserComponent implements OnInit {
  books: Book[] = [];
  private libraryId: number = 1;
  private currentPage: number = 0;

  constructor(private bookService: BookService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const libraryId = params.get('libraryId');
      if (libraryId) {
        this.libraryId = +libraryId;
        this.resetState();
        this.loadBooks();
      }
    });
  }

  resetState(): void {
    this.books = [];
    this.currentPage = 0;
  }

  loadBooks(): void {
    this.bookService.loadBooks(this.libraryId, this.currentPage).subscribe({
      next: (response) => {
        this.books = [...this.books, ...response.content];
        this.currentPage++;
      },
      error: (err) => {
        console.error('Error loading books:', err);
      },
    });
  }

  coverImageSrc(bookId: number): string {
    return this.bookService.getBookCoverUrl(bookId);
  }

  loadMore(): void {
    this.loadBooks();
  }

  getAuthorNames(book: Book): string {
    return book.authors?.map((author) => author.name).join(', ') || 'No authors available';
  }

  openBook(bookId: number): void {
    const url = `/pdf-viewer/book/${bookId}`;
    window.open(url, '_blank');
  }
}

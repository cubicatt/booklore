import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {Accordion, AccordionContent, AccordionHeader, AccordionPanel} from 'primeng/accordion';
import {AsyncPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {Badge} from 'primeng/badge';
import {combineLatest, Observable, of} from 'rxjs';
import {Author, Book, Category} from '../../../model/book.model';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {BookService} from '../../../service/book.service';
import {Library} from '../../../model/library.model';
import {Shelf} from '../../../model/shelf.model';
import {EntityType} from '../book-browser.component';

@Component({
  selector: 'app-book-filter',
  imports: [
    Accordion,
    AccordionContent,
    AccordionHeader,
    AccordionPanel,
    AsyncPipe,
    Badge,
    NgForOf,
    NgIf,
    NgClass
  ],
  templateUrl: './book-filter.component.html',
  styleUrl: './book-filter.component.scss'
})
export class BookFilterComponent implements OnInit {
  @Output() authorSelected = new EventEmitter<number | null>();
  @Output() categorySelected = new EventEmitter<number | null>();

  @Input() showFilters: boolean = true;
  @Input() entity$!: Observable<Library | Shelf | null> | undefined;
  @Input() entityType$!: Observable<EntityType> | undefined;

  activeAuthor: number | null = null;
  activeCategory: number | null = null;

  authorBookCount$!: Observable<{ author: Author; bookCount: number }[]>;
  categoryBookCount$!: Observable<{ category: Category; bookCount: number }[]>;

  bookService = inject(BookService);

  ngOnInit(): void {
    if (this.entity$ && this.entityType$) {
      this.authorBookCount$ = this.getAuthorBookCountStream();
      this.categoryBookCount$ = this.getCategoryBookCountStream();
    }
  }

  private getAuthorBookCountStream(): Observable<{ author: Author; bookCount: number }[]> {
    return combineLatest([
      this.bookService.bookState$,
      this.entity$ ?? of(null),  // Fallback to an observable emitting null
      this.entityType$ ?? of(EntityType.ALL_BOOKS)  // Fallback to a default entity type
    ]).pipe(
      map(([state, entity, entityType]) => {
        let filteredBooks = this.filterBooksByEntityType(state.books || [], entity, entityType);

        const authorMap = new Map<number, { author: Author; bookCount: number }>();
        filteredBooks.forEach((book) => {
          book.metadata?.authors.forEach((author) => {
            if (!authorMap.has(author.id)) {
              authorMap.set(author.id, { author, bookCount: 0 });
            }
            const authorData = authorMap.get(author.id);
            if (authorData) {
              authorData.bookCount += 1;
            }
          });
        });

        return Array.from(authorMap.values()).sort((a, b) => {
          if (b.bookCount !== a.bookCount) {
            return b.bookCount - a.bookCount;
          }
          return a.author.name.localeCompare(b.author.name);
        });
      }),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );
  }

  private getCategoryBookCountStream(): Observable<{ category: Category; bookCount: number }[]> {
    return combineLatest([
      this.bookService.bookState$,
      this.entity$ ?? of(null),  // Fallback to an observable emitting null
      this.entityType$ ?? of(EntityType.ALL_BOOKS)  // Fallback to a default entity type
    ]).pipe(
      map(([state, entity, entityType]) => {
        let filteredBooks = this.filterBooksByEntityType(state.books || [], entity, entityType);

        const categoryMap = new Map<number, { category: Category; bookCount: number }>();
        filteredBooks.forEach((book) => {
          book.metadata?.categories.forEach((category) => {
            if (!categoryMap.has(category.id)) {
              categoryMap.set(category.id, { category, bookCount: 0 });
            }
            const categoryData = categoryMap.get(category.id);
            if (categoryData) {
              categoryData.bookCount += 1;
            }
          });
        });

        return Array.from(categoryMap.values()).sort((a, b) => {
          if (b.bookCount !== a.bookCount) {
            return b.bookCount - a.bookCount;
          }
          return a.category.name.localeCompare(b.category.name);
        });
      }),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );
  }

  private filterBooksByEntityType(books: Book[], entity: any, entityType: EntityType): Book[] {
    if (entityType === EntityType.LIBRARY && entity && 'id' in entity) {
      return books.filter((book) => book.libraryId === entity.id);
    }
    if (entityType === EntityType.SHELF && entity && 'id' in entity) {
      return books.filter((book) =>
        book.shelves?.some((shelf) => shelf.id === entity.id)
      );
    }
    return books;
  }

  authorClicked(author: { author: Author; bookCount: number }) {
    if (this.activeAuthor === author.author.id) {
      this.activeAuthor = null;
    } else {
      this.activeAuthor = author.author.id;
    }
    this.activeCategory = null;
    this.categorySelected.emit(null);
    this.authorSelected.emit(this.activeAuthor);
  }

  categoryClicked(category: { category: Category; bookCount: number }) {
    if (this.activeCategory === category.category.id) {
      this.activeCategory = null;
    } else {
      this.activeCategory = category.category.id;
    }
    this.activeAuthor = null;
    this.authorSelected.emit(null);
    this.categorySelected.emit(this.activeCategory);
  }
}

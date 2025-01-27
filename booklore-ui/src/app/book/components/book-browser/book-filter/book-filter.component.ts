import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {combineLatest, Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {BookService} from '../../../service/book.service';
import {Library} from '../../../model/library.model';
import {Shelf} from '../../../model/shelf.model';
import {EntityType} from '../book-browser.component';
import {Book} from '../../../model/book.model';
import {Accordion, AccordionContent, AccordionHeader, AccordionPanel} from 'primeng/accordion';
import {AsyncPipe, NgClass, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {Badge} from 'primeng/badge';


type Filter<T> = { value: T; bookCount: number };

@Component({
  selector: 'app-book-filter',
  templateUrl: './book-filter.component.html',
  styleUrls: ['./book-filter.component.scss'],
  standalone: true,
  imports: [
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    NgIf,
    NgForOf,
    NgClass,
    Badge,
    AsyncPipe,
    TitleCasePipe
  ]
})
export class BookFilterComponent implements OnInit {
  @Output() filterSelected = new EventEmitter<{ type: string; value: any } | null>();

  @Input() showFilters: boolean = true;
  @Input() entity$!: Observable<Library | Shelf | null> | undefined;
  @Input() entityType$!: Observable<EntityType> | undefined;

  activeFilter: { type: string; value: any | null } = {type: '', value: null};
  filterStreams: Record<string, Observable<Filter<any>[]>> = {};
  filterTypes: string[] = [];

  bookService = inject(BookService);


  ngOnInit(): void {
    if (this.entity$ && this.entityType$) {
      this.filterStreams = {
        author: this.getFilterStream((book: Book) => book.metadata?.authors.map((name) => ({id: name, name})) || [], 'id', 'name'),
        category: this.getFilterStream((book: Book) => book.metadata?.categories.map((name) => ({id: name, name})) || [], 'id', 'name'),
        series: this.getFilterStream((book) => (book.metadata?.seriesName ? [{id: book.metadata.seriesName, name: book.metadata.seriesName}] : []), 'id', 'name'),
        award: this.getFilterStream((book) => book.metadata?.awards?.filter((award) => award.designation === 'WINNER'), 'name', 'name'),
        publisher: this.getFilterStream((book) => (book.metadata?.publisher ? [{id: book.metadata.publisher, name: book.metadata.publisher}] : []), 'id', 'name'),
      };
      this.filterTypes = Object.keys(this.filterStreams);
    }
  }

  private getFilterStream<T>(extractor: (book: Book) => T[] | undefined, idKey: keyof T, nameKey: keyof T): Observable<Filter<T[keyof T]>[]> {
    return combineLatest([this.bookService.bookState$, this.entity$ ?? of(null), this.entityType$ ?? of(EntityType.ALL_BOOKS)])
      .pipe(
        map(([state, entity, entityType]) => {
          const filteredBooks = this.filterBooksByEntityType(state.books || [], entity, entityType);
          const filterMap = new Map<any, Filter<any>>();
          filteredBooks.forEach((book) => {
            (extractor(book) || []).forEach((item) => {
              const id = item[idKey];
              if (!filterMap.has(id)) {
                filterMap.set(id, {value: item, bookCount: 0});
              }
              filterMap.get(id)!.bookCount += 1;
            });
          });
          return Array.from(filterMap.values()).sort((a, b) => b.bookCount - a.bookCount || a.value[nameKey].localeCompare(b.value[nameKey]));
        })
      );
  }

  private filterBooksByEntityType(books: Book[], entity: any, entityType: EntityType): Book[] {
    if (entityType === EntityType.LIBRARY && entity && 'id' in entity) {
      return books.filter((book) => book.libraryId === entity.id);
    }
    if (entityType === EntityType.SHELF && entity && 'id' in entity) {
      return books.filter((book) => book.shelves?.some((shelf) => shelf.id === entity.id));
    }
    return books;
  }

  handleFilterClick(filterType: string, value: any) {
    if (this.activeFilter.type === filterType && this.activeFilter.value === value) {
      this.activeFilter = {type: '', value: null};
      this.filterSelected.emit(null);
    } else {
      this.activeFilter = {type: filterType, value};
      this.filterSelected.emit({type: filterType, value});
    }
  }
}

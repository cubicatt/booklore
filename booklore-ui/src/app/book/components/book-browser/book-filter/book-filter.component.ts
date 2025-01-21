import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {Accordion, AccordionContent, AccordionHeader, AccordionPanel} from 'primeng/accordion';
import {AsyncPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {Badge} from 'primeng/badge';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {Author, Category} from '../../../model/book.model';
import {BookState} from '../../../model/state/book-state.model';
import {map} from 'rxjs/operators';
import {BookService} from '../../../service/book.service';

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
export class BookFilterComponent {

  @Output() authorSelected = new EventEmitter<number | null>();
  @Output() categorySelected = new EventEmitter<number | null>();

  activeAuthor: number | null = null;
  activeCategory: number | null = null;

  bookService = inject(BookService);

  authorBookCount$: Observable<{ author: Author; bookCount: number; }[]> | undefined = this.bookService.authorBookCount$;
  categoryBookCount$: Observable<{ category: Category; bookCount: number; }[]> | undefined = this.bookService.categoryBookCount$;

  @Input() showFilters: boolean = true;

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

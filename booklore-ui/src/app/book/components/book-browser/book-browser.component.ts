import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {MenuItem, MessageService} from 'primeng/api';
import {LibraryService} from '../../service/library.service';
import {BookService} from '../../service/book.service';
import {map, switchMap} from 'rxjs/operators';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {ShelfService} from '../../service/shelf.service';
import {ShelfAssignerComponent} from '../shelf-assigner/shelf-assigner.component';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Library} from '../../model/library.model';
import {Shelf} from '../../model/shelf.model';
import {SortService} from '../../service/sort.service';
import {SortOption} from '../../model/sort.model';
import {BookState} from '../../model/state/book-state.model';
import {Book} from '../../model/book.model';
import {LibraryShelfMenuService} from '../../service/library-shelf-menu.service';
import {BookTableComponent} from './book-table/book-table.component';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {MetadataFetchOptionsComponent} from '../../../metadata/metadata-options-dialog/metadata-fetch-options/metadata-fetch-options.component';
import {MetadataRefreshType} from '../../../metadata/model/request/metadata-refresh-type.enum';
import {Button} from 'primeng/button';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {VirtualScrollerModule} from '@iharbeck/ngx-virtual-scroller';
import {BookCardComponent} from './book-card/book-card.component';
import {ProgressSpinner} from 'primeng/progressspinner';
import {Select} from 'primeng/select';
import {RadioButton} from 'primeng/radiobutton';
import {Menu} from 'primeng/menu';
import {InputText} from 'primeng/inputtext';
import {FormsModule} from '@angular/forms';

export enum EntityType {
  LIBRARY = 'Library',
  SHELF = 'Shelf',
  ALL_BOOKS = 'All Books'
}

@Component({
  selector: 'app-book-browser',
  standalone: true,
  templateUrl: './book-browser.component.html',
  styleUrls: ['./book-browser.component.scss'],
  imports: [Button, NgIf, VirtualScrollerModule, BookCardComponent, AsyncPipe, ProgressSpinner, Select, RadioButton, Menu, NgForOf, InputText, FormsModule, BookTableComponent],
  animations: [
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateY(100%)'
      })),
      state('*', style({
        transform: 'translateY(0)'
      })),
      transition(':enter', [
        animate('0.1s ease-in')
      ]),
      transition(':leave', [
        animate('0.1s ease-out')
      ])
    ])
  ]
})
export class BookBrowserComponent implements OnInit {
  bookState$: Observable<BookState> | undefined;
  entity$: Observable<Library | Shelf | null> | undefined;
  entityType$: Observable<EntityType> | undefined;
  bookOrAuthor$ = new BehaviorSubject<string>('');

  entity: Library | Shelf | null = null;
  entityType: EntityType | undefined;
  bookTitle: string = '';
  entityOptions: MenuItem[] | undefined;
  selectedBooks = new Set<number>();
  selectedSort: SortOption | null = null;
  sortOptions: SortOption[] = [];
  isDrawerVisible: boolean = false;
  dynamicDialogRef: DynamicDialogRef | undefined;
  EntityType = EntityType;

  stateOptions: any[] = [{label: 'Grid', value: 'grid'}, {label: 'Table', value: 'table'}];
  value: string = 'table';

  @ViewChild(BookTableComponent) bookTableComponent!: BookTableComponent;

  private activatedRoute = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private libraryService = inject(LibraryService);
  private bookService = inject(BookService);
  private shelfService = inject(ShelfService);
  private dialogService = inject(DialogService);
  private sortService = inject(SortService);
  private libraryShelfMenuService = inject(LibraryShelfMenuService);

  ngOnInit(): void {
    this.bookService.loadBooks();
    this.sortOptions = SortService.generateSortOptions();
    const isAllBooksRoute = this.activatedRoute.snapshot.routeConfig?.path === 'all-books';

    if (isAllBooksRoute) {
      this.entityType = EntityType.ALL_BOOKS;
      this.entityType$ = of(EntityType.ALL_BOOKS);
      this.bookState$ = this.fetchAllBooks();
    } else {

      const routeEntityInfo$ = this.getEntityInfoFromRoute();

      this.bookState$ = routeEntityInfo$.pipe(
        switchMap(({entityId, entityType}) => this.fetchBooksByEntity(entityId, entityType)),
      );

      this.entity$ = routeEntityInfo$.pipe(
        switchMap(({entityId, entityType}) => this.fetchEntity(entityId, entityType))
      );

      this.entityType$ = routeEntityInfo$.pipe(
        map(({entityType}) => entityType)
      );

      this.entity$.subscribe(entity => {
        this.entity = entity;
        this.entityOptions = this.libraryShelfMenuService.initializeLibraryMenuItems(entity);
        this.setSelectedSortFromEntity(entity);
      });
    }

    this.activatedRoute.paramMap.subscribe(() => {
      this.bookOrAuthor$.next('');
      this.bookTitle = '';
      this.deselectAllBooks();
    });
  }

  private getEntityInfoFromRoute(): Observable<{ entityId: number; entityType: EntityType }> {
    return this.activatedRoute.paramMap.pipe(
      map(params => {
        const libraryId = Number(params.get('libraryId') || NaN);
        const shelfId = Number(params.get('shelfId') || NaN);
        if (!isNaN(libraryId)) {
          return {entityId: libraryId, entityType: EntityType.LIBRARY};
        } else if (!isNaN(shelfId)) {
          return {entityId: shelfId, entityType: EntityType.SHELF};
        } else {
          return {entityId: NaN, entityType: EntityType.ALL_BOOKS};
        }
      })
    );
  }

  private fetchEntity(entityId: number, entityType: EntityType): Observable<Library | Shelf | null> {
    if (entityType == EntityType.LIBRARY) {
      return this.fetchLibrary(entityId);
    } else if (EntityType.SHELF) {
      this.libraryShelfMenuService.initializeLibraryMenuItems(this.entity);
      return this.fetchShelf(entityId);
    }
    return of(null);
  }

  private fetchBooksByEntity(entityId: number, entityType: EntityType): Observable<BookState> {
    if (entityType == EntityType.LIBRARY) {
      return this.fetchBooksByLibrary(entityId);
    } else if (entityType == EntityType.SHELF) {
      return this.fetchBooksByShelf(entityId);
    } else {
      return this.fetchAllBooks();
    }
  }

  private fetchBooksByLibrary(libraryId: number): Observable<BookState> {
    return this.fetchBooks(book => book.libraryId === libraryId);
  }

  private fetchBooksByShelf(shelfId: number): Observable<BookState> {
    return this.fetchBooks(book => {
      return book.shelves?.some(shelf => shelf.id === shelfId) ?? false;
    });
  }

  private fetchAllBooks(): Observable<BookState> {
    return this.bookService.bookState$.pipe(
      map(bookState => this.processBookState(bookState)),
      switchMap(bookState => this.filterBooks(bookState))
    );
  }

  private fetchBooks(bookFilter: (book: Book) => boolean): Observable<BookState> {
    return this.bookService.bookState$.pipe(
      map(bookState => {
        if (bookState.loaded && !bookState.error) {
          const filteredBooks = bookState.books?.filter(bookFilter) || [];
          const sortedBooks = this.sortService.applySort(filteredBooks, this.selectedSort);
          return {...bookState, books: sortedBooks};
        }
        return bookState;
      }),
      switchMap(bookState => this.filterBooks(bookState))
    );
  }

  private processBookState(bookState: BookState): BookState {
    if (bookState.loaded && !bookState.error) {
      const sortedBooks = this.sortService.applySort(bookState.books || [], this.selectedSort);
      return {...bookState, books: sortedBooks};
    }
    return bookState;
  }

  private filterBooks(bookState: BookState): Observable<BookState> {
    return this.bookOrAuthor$.pipe(
      map(title => {
        if (title && title.trim() !== '') {
          const filteredBooks = bookState.books?.filter(book => {
            const matchesTitle = book.metadata?.title?.toLowerCase().includes(title.toLowerCase());
            const matchesAuthor = book.metadata?.authors.some(author =>
              author.name.toLowerCase().includes(title.toLowerCase())
            );
            return matchesTitle || matchesAuthor;
          }) || null;
          return {...bookState, books: filteredBooks};
        }
        return bookState;
      })
    );
  }

  private fetchLibrary(libraryId: number): Observable<Library | null> {
    return this.libraryService.libraryState$.pipe(
      map(libraryState => {
        if (libraryState.libraries) {
          return libraryState.libraries.find(lib => lib.id === libraryId) || null;
        }
        return null;
      })
    );
  }

  private fetchShelf(shelfId: number): Observable<Shelf | null> {
    return this.shelfService.shelfState$.pipe(
      map(shelfState => {
        if (shelfState.shelves) {
          return shelfState.shelves.find(shelf => shelf.id === shelfId) || null;
        }
        return null;
      })
    );
  }

  handleBookSelect(bookId: number, selected: boolean): void {
    if (selected) {
      this.selectedBooks.add(bookId);
    } else {
      this.selectedBooks.delete(bookId);
    }
    this.isDrawerVisible = this.selectedBooks.size > 0;
  }

  onSelectedBooksChange(selectedBookIds: Set<number>): void {
    this.selectedBooks = new Set(selectedBookIds);
    this.isDrawerVisible = this.selectedBooks.size > 0;
  }

  deselectAllBooks(): void {
    this.selectedBooks.clear();
    this.isDrawerVisible = false;
    if(this.bookTableComponent) {
      this.bookTableComponent.clearSelectedBooks();
    }
  }

  viewChanged() {
    this.selectedBooks.clear();
    this.isDrawerVisible = false;
  }

  unshelfBooks() {
    if (this.entity) {
      this.bookService.updateBookShelves(this.selectedBooks, new Set(), new Set([this.entity.id])).subscribe(
        {
          next: () => {
            this.messageService.add({severity: 'info', summary: 'Success', detail: 'Books shelves updated'});
            this.selectedBooks = new Set<number>();
          },
          error: () => {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update books shelves'});
          }
        }
      );
    }
  }

  updateSortOption(sortOption: SortOption): void {
    this.selectedSort = sortOption;
    if (this.entityType === EntityType.ALL_BOOKS) {
      this.bookState$ = this.fetchAllBooks();
    } else {
      const routeParam$ = this.getEntityInfoFromRoute();
      this.bookState$ = routeParam$.pipe(
        switchMap(({entityId, entityType}) => this.fetchBooksByEntity(entityId, entityType))
      );
    }
    if (this.entityType === EntityType.LIBRARY) {
      this.libraryService.updateSort(this.entity?.id!, sortOption).subscribe();
    } else if (this.entityType === EntityType.SHELF) {
      this.shelfService.updateSort(this.entity?.id!, sortOption).subscribe();
    }
  }

  private setSelectedSortFromEntity(entity: Library | Shelf | null): void {
    if (entity?.sort) {
      const {field, direction} = entity.sort;
      this.selectedSort = this.sortOptions.find(option => option.field === field && option.direction === direction) || null;
    } else {
      this.selectedSort = null;
    }
  }

  onBookTitleChange(newTitle: string): void {
    this.bookOrAuthor$.next(newTitle);
  }

  openShelfAssigner() {
    this.dynamicDialogRef = this.dialogService.open(ShelfAssignerComponent, {
      header: `Update Books' Shelves`,
      modal: true,
      closable: true,
      contentStyle: {overflow: 'auto'},
      baseZIndex: 10,
      style: {
        position: 'absolute',
        top: '15%',
      },
      data: {
        isMultiBooks: true,
        bookIds: this.selectedBooks
      },
    });
    this.dynamicDialogRef.onClose.subscribe(() => {
      this.selectedBooks.clear();
    });
  }

  updateMetadata() {
    this.dialogService.open(MetadataFetchOptionsComponent, {
      header: 'Metadata Refresh Options',
      modal: true,
      closable: true,
      data: {
        bookIds: Array.from(this.selectedBooks),
        metadataRefreshType: MetadataRefreshType.BOOKS
      }
    })
  }

}

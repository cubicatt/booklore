import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
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
import {SortOptionsHelper} from '../../service/sort-options.helper';
import {SortOption} from '../../model/sort.model';
import {BookState} from '../../model/state/book-state.model';
import {Book} from '../../model/book.model';
import {LibraryShelfMenuService} from '../../service/library-shelf-menu.service';

export enum EntityType {
  LIBRARY = 'Library',
  SHELF = 'Shelf',
  ALL_BOOKS = 'All Books'
}

@Component({
  selector: 'app-book-browser',
  standalone: false,
  templateUrl: './book-browser.component.html',
  styleUrls: ['./book-browser.component.scss']
})
export class BookBrowserComponent implements OnInit {
  bookState$: Observable<BookState> | undefined;
  entity$: Observable<Library | Shelf | null> | undefined;
  entityType$: Observable<EntityType> | undefined;
  bookTitle$ = new BehaviorSubject<string>('');

  entity: Library | Shelf | null = null;
  entityType: EntityType | undefined;
  bookTitle: string = '';
  entityOptions: MenuItem[] | undefined;
  selectedBooks: Set<number> = new Set();
  selectedSort: SortOption | null = null;
  sortOptions: SortOption[] = [];
  isDrawerVisible: boolean = false;
  ref: DynamicDialogRef | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private messageService: MessageService,
    private libraryService: LibraryService,
    private bookService: BookService,
    private shelfService: ShelfService,
    private dialogService: DialogService,
    private sortService: SortService,
    private libraryShelfMenuService: LibraryShelfMenuService
  ) {
  }

  ngOnInit(): void {
    this.sortOptions = SortOptionsHelper.generateSortOptions();
    const isAllBooksRoute = this.activatedRoute.snapshot.routeConfig?.path === 'all-books';

    if (isAllBooksRoute) {
      this.entityType$ = this.activatedRoute.url.pipe(
        map(segments => {
          return EntityType.ALL_BOOKS;
        })
      );
      this.entityType = EntityType.ALL_BOOKS;
      this.bookState$ = this.fetchAllBooks();
    } else {

      const routeParam$ = this.getRouteParams();

      this.bookState$ = routeParam$.pipe(
        switchMap(({libraryId, shelfId}) => this.fetchBooksByEntity(libraryId, shelfId)),
      );

      this.entity$ = routeParam$.pipe(
        switchMap(({libraryId, shelfId}) => this.fetchEntity(libraryId, shelfId))
      );

      this.entityType$ = routeParam$.pipe(
        map(({libraryId, shelfId}) => libraryId ? EntityType.LIBRARY : shelfId ? EntityType.SHELF : EntityType.ALL_BOOKS)
      );

      this.entity$.subscribe(entity => {
        this.entity = entity;
        this.setSelectedSortFromEntity(entity);
      });
    }

    this.activatedRoute.paramMap.subscribe(() => {
      this.bookTitle$.next('');
      this.bookTitle = '';
    });

  }

  private getRouteParams(): Observable<{ libraryId: number; shelfId: number }> {
    return this.activatedRoute.paramMap.pipe(
      map(params => {
        const libraryId = Number(params.get('libraryId'));
        const shelfId = Number(params.get('shelfId'));
        return {libraryId, shelfId};
      })
    );
  }

  private fetchEntity(libraryId: number, shelfId: number): Observable<Library | Shelf | null> {
    if (libraryId) {
      this.entityType = EntityType.LIBRARY;
      this.libraryShelfMenuService.initializeLibraryMenuItems(this.entity);
      return this.fetchLibrary(libraryId);
    } else if (shelfId) {
      this.entityType = EntityType.SHELF;
      this.libraryShelfMenuService.initializeLibraryMenuItems(this.entity);
      return this.fetchShelf(shelfId);
    }
    return of(null);
  }

  private fetchBooksByEntity(libraryId: number, shelfId: number): Observable<BookState> {
    if (libraryId) {
      return this.fetchBooksByLibrary(libraryId);
    } else if (shelfId) {
      return this.fetchBooksByShelf(shelfId);
    }
    return of({
      books: null,
      loaded: true,
      error: 'Invalid entity type'
    });
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
      map(bookState => {
        if (bookState.loaded && !bookState.error) {
          const sortedBooks = this.sortService.applySort(bookState.books || [], this.selectedSort);
          return {...bookState, books: sortedBooks};
        } else {
          return bookState;
        }
      }),
      switchMap(bookState =>
        this.bookTitle$.pipe(
          map(title => {
            if (title && title.trim() !== '') {
              const filteredBooks = bookState.books?.filter(book => book.metadata?.title?.toLowerCase().includes(title.toLowerCase())) || null;
              return {...bookState, books: filteredBooks};
            }
            return bookState;
          })
        )
      )
    );
  }

  private fetchBooks(bookFilter: (book: Book) => boolean): Observable<BookState> {
    return this.bookService.bookState$.pipe(
      map(bookState => {
        if (bookState.loaded && !bookState.error) {
          const filteredBooks = bookState.books!.filter(book => {
            return bookFilter(book);
          });
          const sortedBooks = this.sortService.applySort(filteredBooks, this.selectedSort);
          return {...bookState, books: sortedBooks};
        } else {
          return bookState;
        }
      }),
      switchMap(bookState =>
        this.bookTitle$.pipe(
          map(title => {
            if (title && title.trim() !== '') {
              const filteredBooks = bookState.books?.filter(book => book.metadata?.title?.toLowerCase().includes(title.toLowerCase())) || null;
              return {...bookState, books: filteredBooks};
            }
            return bookState;
          })
        )
      )
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

  deselectAllBooks(): void {
    this.selectedBooks.clear();
    this.isDrawerVisible = false;
  }

  unshelfBooks() {
    if (this.entity) {
      this.bookService.updateBookShelves(this.selectedBooks, new Set(), new Set([this.entity.id])).subscribe(
        () => {
          this.messageService.add({severity: 'info', summary: 'Success', detail: 'Books shelves updated'});
          this.selectedBooks = new Set<number>();
        },
        (error) => {
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update books shelves'});
        }
      );
    }
  }

  updateSortOption(sortOption: SortOption): void {
    this.selectedSort = sortOption;
    if (this.entityType === EntityType.ALL_BOOKS) {
      this.bookState$ = this.fetchAllBooks();
    } else {
      const routeParam$ = this.getRouteParams();
      this.bookState$ = routeParam$.pipe(
        switchMap(({libraryId, shelfId}) => this.fetchBooksByEntity(libraryId, shelfId))
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
    this.bookTitle$.next(newTitle);
  }

  openShelfAssigner() {
    this.ref = this.dialogService.open(ShelfAssignerComponent, {
      header: `Update Books Shelves`,
      modal: true,
      closable: true,
      width: '30%',
      height: '60%',
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
    this.ref.onClose.subscribe(() => {
      this.selectedBooks.clear();
    });
  }

  protected readonly EntityType = EntityType;
}

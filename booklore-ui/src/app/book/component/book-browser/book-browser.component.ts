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

@Component({
  selector: 'app-book-browser',
  standalone: false,
  templateUrl: './book-browser.component.html',
  styleUrls: ['./book-browser.component.scss']
})
export class BookBrowserComponent implements OnInit {
  bookState$: Observable<BookState> | undefined;
  entity$: Observable<Library | Shelf | null> | undefined;
  entityType$: Observable<string | null> | undefined;
  bookTitle$ = new BehaviorSubject<string>('');

  entity: Library | Shelf | null = null;
  entityType: string = '';
  bookTitle: string = '';
  entityOptions: MenuItem[] | undefined;
  multiSelectItems: MenuItem[] | undefined;
  selectedBooks: Set<number> = new Set();
  selectedSort: SortOption | null = null;
  sortOptions: SortOption[] = [];
  isDrawerVisible: boolean = false;
  ref: DynamicDialogRef | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private libraryService: LibraryService,
    private bookService: BookService,
    private shelfService: ShelfService,
    private dialogService: DialogService,
    private sortService: SortService
  ) {
  }

  ngOnInit(): void {
    this.sortOptions = SortOptionsHelper.generateSortOptions();
    const routeParam$ = this.getRouteParams();

    this.bookState$ = routeParam$.pipe(
      switchMap(({libraryId, shelfId}) => this.fetchBooksByEntity(libraryId, shelfId)),
    );

    this.entity$ = routeParam$.pipe(
      switchMap(({libraryId, shelfId}) => this.fetchEntity(libraryId, shelfId))
    );

    this.entityType$ = routeParam$.pipe(
      map(({libraryId, shelfId}) => libraryId ? 'Library' : shelfId ? 'Shelf' : null)
    );

    this.entity$.subscribe(entity => {
      this.entity = entity;
      this.setSelectedSortFromEntity(entity);
    });

    this.activatedRoute.paramMap.subscribe(() => {
      this.bookTitle$.next('');
      this.bookTitle = '';
    });

    //this.setupMenu();
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
      this.entityType = 'Library';
      this.initializeLibraryMenuItems();
      return this.fetchLibrary(libraryId);
    } else if (shelfId) {
      this.entityType = 'Shelf';
      this.initializeShelfMenuItems();
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

  private fetchBooks(bookFilter: (book: Book) => boolean): Observable<BookState> {
    return this.bookService.bookState$.pipe(
      map(bookState => {
        if (bookState.loaded && !bookState.error) {
          const filteredBooks = bookState.books!.filter(book => {
            return bookFilter(book);
          });
          const sortedBooks = this.sortService.applySort(filteredBooks, this.selectedSort);
          return { ...bookState, books: sortedBooks };
        } else {
          return bookState;
        }
      }),
      switchMap(bookState =>
        this.bookTitle$.pipe(
          map(title => {
            if (title && title.trim() !== '') {
              const filteredBooks = bookState.books?.filter(book => book.metadata?.title?.toLowerCase().includes(title.toLowerCase())) || null;
              return { ...bookState, books: filteredBooks };
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
    const routeParam$ = this.getRouteParams();
    this.bookState$ = routeParam$.pipe(
      switchMap(({libraryId, shelfId}) => this.fetchBooksByEntity(libraryId, shelfId))
    );
    if (this.entityType === 'Library') {
      this.libraryService.updateSort(this.entity?.id!, sortOption).subscribe();
    } else if (this.entityType === 'Shelf') {
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

  /*setupMenu(): void {
    this.multiSelectItems = [
      {
        label: 'Options',
        items: [
          {
            label: 'Edit shelf',
            icon: 'pi pi-folder',
            command: () => {

            }
          }
        ],
      },
    ];
  }*/

  private initializeLibraryMenuItems(): void {
    this.entityOptions = [
      {
        label: 'Options',
        items: [
          {
            label: 'Delete Library',
            icon: 'pi pi-trash',
            command: () => {
              this.confirmationService.confirm({
                message: 'Sure you want to delete library: ' + this.entity?.name + "?",
                header: 'Confirmation',
                icon: 'pi pi-exclamation-triangle',
                acceptIcon: 'none',
                rejectIcon: 'none',
                acceptButtonStyleClass: 'p-button-text',
                accept: () => {
                  this.libraryService.deleteLibrary(this.entity?.id!).subscribe({
                    complete: () => {
                      this.router.navigate(['/']);
                      this.messageService.add({severity: 'info', summary: 'Success', detail: 'Library was deleted'});
                    },
                    error: () => {
                      this.messageService.add({
                        severity: 'error',
                        summary: 'Failed',
                        detail: 'Failed to delete library',
                        life: 3000
                      });
                    }
                  });
                }
              });
            }
          },
          {
            label: 'Refresh Library',
            icon: 'pi pi-refresh',
            command: () => {
              this.confirmationService.confirm({
                message: 'Sure you want to refresh library: ' + this.entity?.name + "?",
                header: 'Confirmation',
                icon: 'pi pi-exclamation-triangle',
                acceptIcon: 'none',
                rejectIcon: 'none',
                acceptButtonStyleClass: 'p-button-text',
                accept: () => {
                  this.libraryService.refreshLibrary(this.entity?.id!).subscribe({
                    complete: () => {
                      this.messageService.add({
                        severity: 'info',
                        summary: 'Success',
                        detail: 'Library refresh scheduled'
                      });
                    },
                    error: () => {
                      this.messageService.add({
                        severity: 'error',
                        summary: 'Failed',
                        detail: 'Failed to refresh library',
                        life: 3000
                      });
                    }
                  });
                }
              });
            }
          }
        ],
      },
    ];
  }

  private initializeShelfMenuItems(): void {
    this.entityOptions = [
      {
        label: 'Options',
        items: [
          {
            label: 'Delete Shelf',
            icon: 'pi pi-trash',
            command: () => {
              this.confirmationService.confirm({
                message: 'Sure you want to delete ' + this.entity?.name + "?",
                header: 'Confirmation',
                icon: 'pi pi-exclamation-triangle',
                acceptIcon: 'none',
                rejectIcon: 'none',
                acceptButtonStyleClass: 'p-button-text',
                accept: () => {
                  this.shelfService.deleteShelf(this.entity?.id!).subscribe({
                    complete: () => {
                      this.router.navigate(['/']);
                      this.messageService.add({severity: 'info', summary: 'Success', detail: 'Shelf was deleted'});
                    },
                    error: () => {
                      this.messageService.add({
                        severity: 'error',
                        summary: 'Failed',
                        detail: 'Failed to delete shelf',
                        life: 3000
                      });
                    }
                  });
                }
              });
            }
          }
        ],
      },
    ];
  }
}

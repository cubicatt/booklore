import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
import {LibraryService} from '../../service/library.service';
import {BookService} from '../../service/book.service';
import {map, switchMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {Book} from '../../model/book.model';
import {ShelfService} from '../../service/shelf.service';
import {ShelfAssignerComponent} from '../shelf-assigner/shelf-assigner.component';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Library} from '../../model/library.model';
import {Shelf} from '../../model/shelf.model';
import {SortService} from '../../service/sort.service';
import {SortOptionsHelper} from '../../service/sort-options.helper';
import {SortOption} from '../../model/sort.model';

@Component({
  selector: 'app-books-browser',
  standalone: false,
  templateUrl: './books-browser.component.html',
  styleUrls: ['./books-browser.component.scss']
})
export class BooksBrowserComponent implements OnInit {
  books$: Observable<Book[]> | undefined;
  entity$: Observable<Library | Shelf | null> | undefined;
  entityType$: Observable<string | null> | undefined;

  entity: Library | Shelf | null = null;
  entityType: string = '';
  speedDialItems: MenuItem[] | undefined;
  multiSelectItems: MenuItem[] | undefined;
  selectedBooks: Set<number> = new Set();
  selectedSort: SortOption | null = null;
  sortOptions: SortOption[] = [];

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

    this.books$ = routeParam$.pipe(
      switchMap(({libraryId, shelfId}) => this.fetchBooks(libraryId, shelfId))
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

    this.setupMenu();
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

  private fetchBooks(libraryId: number, shelfId: number): Observable<Book[]> {
    if (libraryId) {
      return this.fetchBooksByLibrary(libraryId);
    } else if (shelfId) {
      return this.fetchBooksByShelf(shelfId);
    }
    return of([]);
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

  private fetchBooksByLibrary(libraryId: number): Observable<Book[]> {
    return this.bookService.books$.pipe(
      map(books => books.filter(book => book.libraryId === libraryId)),
      map(books => this.sortService.applySort(books, this.selectedSort))
    );
  }

  private fetchBooksByShelf(shelfId: number): Observable<Book[]> {
    return this.bookService.books$.pipe(
      map(books => books.filter(book => book.shelves?.some(shelf => shelf.id === shelfId))),
      map(books => this.sortService.applySort(books, this.selectedSort))
    );
  }

  private fetchLibrary(libraryId: number): Observable<Library | null> {
    return this.libraryService.libraries$.pipe(
      map(libraries => libraries.find(lib => lib.id === libraryId) || null)
    );
  }

  private fetchShelf(shelfId: number): Observable<Shelf | null> {
    return this.shelfService.shelves$.pipe(
      map(shelves => shelves.find(shelf => shelf.id === shelfId) || null)
    );
  }

  handleBookSelect(bookId: number, selected: boolean): void {
    if (selected) {
      this.selectedBooks.add(bookId);
    } else {
      this.selectedBooks.delete(bookId);
    }
  }

  deselectAllBooks(): void {
    this.selectedBooks.clear();
  }

  isAnyBookSelected(): boolean {
    return this.selectedBooks.size > 0;
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
    this.books$ = routeParam$.pipe(
      switchMap(({libraryId, shelfId}) => this.fetchBooks(libraryId, shelfId))
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

  setupMenu(): void {
    this.multiSelectItems = [
      {
        label: 'Options',
        items: [
          {
            label: 'Edit shelf',
            icon: 'pi pi-folder',
            command: () => {
              this.ref = this.dialogService.open(ShelfAssignerComponent, {
                header: `Update Books Shelves`,
                modal: true,
                width: '30%',
                height: '70%',
                contentStyle: {overflow: 'auto'},
                baseZIndex: 10,
                data: {
                  isMultiBooks: true,
                  bookIds: this.selectedBooks
                },
              });
              this.ref.onClose.subscribe(() => {
                this.selectedBooks.clear();
              });
            }
          }
        ],
      },
    ];
  }

  private initializeLibraryMenuItems(): void {
    this.speedDialItems = [
      {
        icon: 'pi pi-trash',
        tooltipOptions: {
          tooltipLabel: 'Delete',
          tooltipPosition: 'top'
        },
        command: () => {
          this.confirmationService.confirm({
            message: 'Sure you want to delete library: ' + this.entity?.name + "?",
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon: 'none',
            rejectIcon: 'none',
            rejectButtonStyleClass: 'p-button-text',
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
        icon: 'pi pi-refresh',
        tooltipOptions: {
          tooltipLabel: 'Refresh',
          tooltipPosition: 'top'
        },
        command: () => {
          this.confirmationService.confirm({
            message: 'Sure you want to refresh library: ' + this.entity?.name + "?",
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon: 'none',
            rejectIcon: 'none',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
              this.libraryService.refreshLibrary(this.entity?.id!).subscribe({
                complete: () => {
                  this.messageService.add({severity: 'info', summary: 'Success', detail: 'Library refresh scheduled'});
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
    ];
  }

  private initializeShelfMenuItems(): void {
    this.speedDialItems = [
      {
        icon: 'pi pi-trash',
        tooltipOptions: {
          tooltipLabel: 'Delete',
          tooltipPosition: 'top'
        },
        command: () => {
          this.confirmationService.confirm({
            message: 'Sure you want to delete ' + this.entity?.name + "?",
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon: 'none',
            rejectIcon: 'none',
            rejectButtonStyleClass: 'p-button-text',
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
    ];
  }

}

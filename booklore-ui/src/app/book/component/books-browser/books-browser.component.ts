import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
import {LibraryService} from '../../service/library.service';
import {BookService} from '../../service/book.service';
import {map, switchMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {Book} from '../../model/book.model';
import {Shelf} from '../../model/book.model';
import {ShelfService} from '../../service/shelf.service';
import {ShelfAssignerComponent} from '../shelf-assigner/shelf-assigner.component';
import {DialogService} from 'primeng/dynamicdialog';
import {SortOption} from '../../model/sort-option.model';
import {SortService} from '../../service/sort.service';
import {Library} from '../../model/library.model';

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

  items: MenuItem[] | undefined;
  selectedBooks: Set<number> = new Set();
  entity: Library | Shelf | null = null;
  entityType: string = '';
  selectedSort: SortOption | null = null;
  sortOptions: SortOption[] = [
    {label: '↑ Title', value: 'ascendingTitle'},
    {label: '↓ Title', value: 'descendingTitle'},
    {label: '↑ Published Date', value: 'ascendingDate'},
    {label: '↓ Published Date', value: 'descendingDate'}
  ];

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
    const routeParam$ = this.activatedRoute.paramMap.pipe(
      map(params => {
        const libraryId = Number(params.get('libraryId'));
        const shelfId = Number(params.get('shelfId'));
        return {libraryId, shelfId};
      })
    );

    this.books$ = routeParam$.pipe(
      switchMap(({libraryId, shelfId}) => this.fetchBooks(libraryId, shelfId))
    );

    this.entity$ = routeParam$.pipe(
      switchMap(({libraryId, shelfId}) => this.fetchEntity(libraryId, shelfId))
    );

    this.entityType$ = routeParam$.pipe(
      switchMap(({libraryId, shelfId}) => this.fetchEntityType(libraryId, shelfId))
    );

    this.entity$.subscribe(entity => {
      this.entity = entity;
    });

    routeParam$.subscribe(({ libraryId, shelfId }) => {
      this.handleSortingState(libraryId, shelfId);
    });

    this.setupMenu();
  }

  private handleSortingState(libraryId: number, shelfId: number): void {
    let entityType: string | null = null;
    let entityId: number | null = null;

    if (libraryId) {
      entityType = 'Library';
      entityId = libraryId;
    } else if (shelfId) {
      entityType = 'Shelf';
      entityId = shelfId;
    }

    if (entityType && entityId !== null) {
      const key = this.sortService.generateKey(entityType, entityId);
      if (key) {
        const storedSort = this.sortService.getSortOption(key);
        if (storedSort) {
          this.selectedSort = storedSort;
        } else {
          this.selectedSort = null;
        }
      }
    }
  }

  private fetchEntityType(libraryId: number, shelfId: number): Observable<string> {
    if (!isNaN(libraryId) && libraryId !== 0) {
      this.entityType = 'Library';
      return of('Library');
    } else if (!isNaN(shelfId) && shelfId !== 0) {
      this.entityType = 'Shelf';
      return of('Shelf');
    }
    return of('');
  }

  private fetchBooks(libraryId: number, shelfId: number): Observable<Book[]> {
    if (libraryId) {
      return this.bookService.books$.pipe(
        map(books => books.filter(book => book.libraryId === libraryId))
      );
    } else if (shelfId) {
      return this.bookService.books$.pipe(
        map(books => books.filter(book => book.shelves?.some(shelf => shelf.id === shelfId)))
      );
    }
    return of([]);
  }

  private fetchEntity(libraryId: number, shelfId: number): Observable<Library | Shelf | null> {
    if (libraryId) {
      return this.libraryService.libraries$.pipe(
        map(libraries => libraries.find(lib => lib.id === libraryId) || null)
      );
    } else if (shelfId) {
      return this.shelfService.shelves$.pipe(
        map(shelves => shelves.find(shelf => shelf.id === shelfId) || null)
      );
    }
    return of(null);
  }

  handleBookSelect(bookId: number, selected: boolean): void {
    if (selected) {
      this.selectedBooks.add(bookId);
    } else {
      this.selectedBooks.delete(bookId);
    }
  }

  setupMenu(): void {
    this.items = [
      {
        label: 'Options',
        items: [
          {
            label: 'Edit shelf',
            icon: 'pi pi-folder',
            command: () => this.openShelfDialog(),
          }
        ],
      },
    ];
  }

  sortBooks(): void {
    if (this.books$ && this.selectedSort) {
      this.books$ = this.books$.pipe(
        map(books => {
          return books.sort((a, b) => {
            const titleA = a.metadata?.title?.toLowerCase() || '';
            const titleB = b.metadata?.title?.toLowerCase() || '';
            const dateA = new Date(a.metadata?.publishedDate || 0);
            const dateB = new Date(b.metadata?.publishedDate || 0);

            switch (this.selectedSort?.value) {
              case 'ascendingTitle':
                return titleA.localeCompare(titleB);
              case 'descendingTitle':
                return titleB.localeCompare(titleA);
              case 'ascendingDate':
                return dateA.getTime() - dateB.getTime();
              case 'descendingDate':
                return dateB.getTime() - dateA.getTime();
              default:
                return 0;
            }
          });
        })
      );
    }
  }

  deselectAllBooks(): void {
    this.selectedBooks.clear();
  }

  isAnyBookSelected(): boolean {
    return this.selectedBooks.size > 0;
  }

  openShelfDialog(): void {
    this.dialogService.open(ShelfAssignerComponent, {
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
    const key = this.sortService.generateKey(this.entityType, this.entity?.id!);
    if (key) {
      this.sortService.setSortOption(key, sortOption);
      this.selectedSort = sortOption;
      this.sortBooks();
    }
  }

}

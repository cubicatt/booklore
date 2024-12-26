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
import {DialogService} from 'primeng/dynamicdialog';
import {SortOption} from '../../model/sort-option.model';
import {SortService} from '../../service/sort.service';
import {Library} from '../../model/library.model';
import {Shelf} from '../../model/shelf.model';

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
    {label: '↑ Title', field: 'title', direction: 'ASCENDING'},
    {label: '↓ Title', field: 'title', direction: 'DESCENDING'},
    {label: '↑ Published Date', field: 'publishedDate', direction: 'ASCENDING'},
    {label: '↓ Published Date', field: 'publishedDate', direction: 'DESCENDING'}
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private libraryService: LibraryService,
    private bookService: BookService,
    private shelfService: ShelfService,
    private dialogService: DialogService
  ) {
  }

  private setSelectedSortFromEntity(entity: Library | Shelf | null): void {
    if (entity?.sort) {
      const {field, direction} = entity.sort;
      this.selectedSort = this.sortOptions.find(
        option => option.field === field && option.direction === direction
      ) || null;
    } else {
      this.selectedSort = null;
    }
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
      this.setSelectedSortFromEntity(entity);
    });

    this.setupMenu();
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
    return this.bookService.books$.pipe(
      map(books => {
        let filteredBooks = books;
        if (libraryId) {
          filteredBooks = books.filter(book => book.libraryId === libraryId);
        } else if (shelfId) {
          filteredBooks = books.filter(book => book.shelves?.some(shelf => shelf.id === shelfId));
        }
        return this.applySort(filteredBooks);
      })
    );
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

  private applySort(books: Book[]): Book[] {
    if (!this.selectedSort) return books;

    const {field, direction} = this.selectedSort;
    return books.sort((a, b) => {
      let valueA: any, valueB: any;
      if (field === 'title') {
        valueA = a.metadata?.title?.toLowerCase() || '';
        valueB = b.metadata?.title?.toLowerCase() || '';
      } else if (field === 'publishedDate') {
        valueA = new Date(a.metadata?.publishedDate || 0).getTime();
        valueB = new Date(b.metadata?.publishedDate || 0).getTime();
      }
      if (valueA === undefined || valueB === undefined) return 0;
      if (direction === 'ASCENDING') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
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
    this.selectedSort = sortOption;
    this.books$ = this.activatedRoute.paramMap.pipe(
      map(params => {
        const libraryId = Number(params.get('libraryId'));
        const shelfId = Number(params.get('shelfId'));
        return {libraryId, shelfId};
      }),
      switchMap(({libraryId, shelfId}) => this.fetchBooks(libraryId, shelfId))
    );
    if (this.entityType === 'Library') {
      this.libraryService.updateSort(this.entity?.id!, sortOption).subscribe();
    } else if (this.entityType === 'Shelf') {
      this.shelfService.updateSort(this.entity?.id!, sortOption).subscribe();
    }
  }

}

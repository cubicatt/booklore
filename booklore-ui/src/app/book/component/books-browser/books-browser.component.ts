import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
import {LibraryService} from '../../service/library.service';
import {BookService} from '../../service/book.service';
import {map, switchMap} from 'rxjs/operators';
import {Observable, of, Subject} from 'rxjs';
import {Book} from '../../model/book.model';
import {Library} from '../../model/library.model';
import {Shelf} from '../../model/book.model';
import {ShelfService} from '../../service/shelf.service';
import {ShelfAssignerComponent} from '../shelf-assigner/shelf-assigner.component';
import {DialogService} from 'primeng/dynamicdialog';

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
  private deselectAllSubject = new Subject<void>(); // Subject to notify deselection
  deselectAll$ = this.deselectAllSubject.asObservable();

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

  ngOnInit(): void {
    const routeParam$ = this.activatedRoute.paramMap.pipe(
      map(params => {
        const libraryId = Number(params.get('libraryId'));
        const shelfId = Number(params.get('shelfId'));
        return {libraryId, shelfId};
      })
    );

    this.books$ = routeParam$.pipe(
      switchMap(({libraryId, shelfId}) => {
        if (!isNaN(libraryId) && libraryId !== 0) {
          return this.bookService.books$.pipe(
            map(books => books.filter(book => book.libraryId === libraryId))
          );
        } else if (!isNaN(shelfId) && shelfId !== 0) {
          return this.bookService.books$.pipe(
            map(books => books.filter(book => book.shelves?.some(shelf => shelf.id === shelfId)))
          );
        } else {
          return of([]);
        }
      })
    );

    this.entity$ = routeParam$.pipe(
      switchMap(({libraryId, shelfId}) => {
        if (!isNaN(libraryId) && libraryId !== 0) {
          return this.libraryService.libraries$.pipe(
            map(libraries => libraries.find(lib => lib.id === libraryId) || null)
          );
        } else if (!isNaN(shelfId) && shelfId !== 0) {
          return this.shelfService.shelves$.pipe(
            map(shelves => shelves.find(shelf => shelf.id === shelfId) || null)
          );
        }
        return of(null);
      })
    );

    this.entityType$ = routeParam$.pipe(
      switchMap(({libraryId, shelfId}) => {
        if (!isNaN(libraryId) && libraryId !== 0) {
          return of('Library');
        } else if (!isNaN(shelfId) && shelfId !== 0) {
          return of('Shelf');
        }
        return of(null);
      })
    );

    this.entity$.subscribe(entity => {
      this.entity = entity;  // Store resolved value in local variable
    });

  }

  handleBookSelect(bookId: number, selected: boolean): void {
    if (selected) {
      this.selectedBooks.add(bookId);
      this.setupMenu();
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
          this.messageService.add({severity: 'info', summary: 'Success', detail: 'Book\'s shelves updated'});
          this.selectedBooks = new Set<number>();
        },
        (error) => {
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update book\'s shelves'});
        }
      );
    }
  }

}

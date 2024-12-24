import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
import {LibraryService} from '../../service/library.service';
import {BookService} from '../../service/book.service';
import {map, switchMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {Book} from '../../model/book.model';
import {Library} from '../../model/library.model';
import {Shelf} from '../../model/book.model';
import {ShelfService} from '../../service/shelf.service';

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

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private libraryService: LibraryService,
    private bookService: BookService,
    private shelfService: ShelfService
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


    //this.initializeMenuItems();
  }

  /*private initializeMenuItems(): void {
    this.items = [
      {
        icon: 'pi pi-trash',
        tooltipOptions: {
          tooltipLabel: 'Delete',
          tooltipPosition: 'top'
        },
        command: () => {
          this.entity$?.subscribe(entity => {
            if (entity) {
              this.confirmationService.confirm({
                message: `Are you sure you want to delete ${entity.name}?`,
                header: 'Confirmation',
                icon: 'pi pi-exclamation-triangle',
                acceptIcon: 'none',
                rejectIcon: 'none',
                rejectButtonStyleClass: 'p-button-text',
                accept: () => {
                  if ('libraryId' in entity) {  // Check if it's a Library
                    this.libraryService.deleteLibrary(entity.id).subscribe({
                      complete: () => {
                        this.router.navigate(['/']);
                        this.messageService.add({
                          severity: 'info',
                          summary: 'Success',
                          detail: 'Library was deleted'
                        });
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
                  } else if ('id' in entity) {  // Check if it's a Shelf
                    this.shelfService.deleteShelf(entity.id).subscribe({
                      complete: () => {
                        this.router.navigate(['/']);
                        this.messageService.add({
                          severity: 'info',
                          summary: 'Success',
                          detail: 'Shelf was deleted'
                        });
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
                }
              });
            }
          });
        }
      }
    ];
  }*/
}

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
import {LibraryService} from '../../service/library.service';
import {BookService} from '../../service/book.service';
import {map, switchMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {Book} from '../../model/book.model';
import {Library} from '../../model/library.model';
import {ShelfService} from '../../service/shelf.service';

@Component({
  selector: 'app-books-browser',
  standalone: false,
  templateUrl: './books-browser.component.html',
  styleUrls: ['./books-browser.component.scss']
})
export class BooksBrowserComponent implements OnInit {

  books$: Observable<Book[]> | undefined;
  library$: Observable<Library | null> | undefined;
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
    const libraryId$ = this.activatedRoute.paramMap.pipe(
      map(params => Number(params.get('libraryId')))
    );

    this.books$ = libraryId$.pipe(
      switchMap(libraryId => {
        if (!isNaN(libraryId)) {
          return this.bookService.books$.pipe(
            map(books => books.filter(book => book.libraryId === libraryId))
          );
        } else {
          return of([]);
        }
      })
    );

    this.library$ = this.activatedRoute.paramMap.pipe(
      switchMap(params => {
        const libraryId = Number(params.get('libraryId'));
        if (!isNaN(libraryId)) {
          return this.libraryService.libraries$.pipe(
            map(libraries => libraries.find(lib => lib.id === libraryId) || null)
          );
        }
        return of(null);
      })
    );

    this.initializeLibraryMenuItems();
  }

  private initializeLibraryMenuItems(): void {
    this.items = [
      {
        icon: 'pi pi-trash',
        tooltipOptions: {
          tooltipLabel: 'Delete',
          tooltipPosition: 'top'
        },
        command: () => {
          this.library$?.subscribe(library => {
            if (library) {
              this.confirmationService.confirm({
                message: `Are you sure you want to delete ${library.name}?`,
                header: 'Confirmation',
                icon: 'pi pi-exclamation-triangle',
                acceptIcon: 'none',
                rejectIcon: 'none',
                rejectButtonStyleClass: 'p-button-text',
                accept: () => {
                  if (library.id) {
                    this.libraryService.deleteLibrary(library.id).subscribe({
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
                  }
                }
              });
            }
          });
        }
      }
    ];
  }

}

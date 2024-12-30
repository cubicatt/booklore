import {Component, OnInit} from '@angular/core';
import {AppMenuitemComponent} from './app.menuitem.component';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {MenuModule} from 'primeng/menu';
import {LibraryService} from '../../service/library.service';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {ShelfService} from '../../service/shelf.service';
import {BookService} from '../../service/book.service';

@Component({
  selector: 'app-menu',
  imports: [AppMenuitemComponent, NgIf, NgForOf, MenuModule, AsyncPipe],
  templateUrl: './app.menu.component.html',
})
export class AppMenuComponent implements OnInit {
  libraryMenu$: Observable<any> | undefined;
  shelfMenu$: Observable<any> | undefined;
  homeMenu$: Observable<any> | undefined;

  constructor(private libraryService: LibraryService, private shelfService: ShelfService, private bookService: BookService) {
  }

  ngOnInit(): void {
    this.libraryMenu$ = this.libraryService.libraryState$.pipe(
      map((state) => [
        {
          label: 'Library',
          separator: false,
          items: state.libraries?.map((library) => ({
            label: library.name,
            icon: 'pi pi-' + library.icon,
            routerLink: [`/library/${library.id}/books`],
            bookCount$: this.libraryService.getBookCount(library.id ?? 0),
          })) || [],
        },
      ])
    );

    this.shelfMenu$ = this.shelfService.shelfState$.pipe(
      map((state) => [
        {
          label: 'Shelves',
          separator: false,
          items: state.shelves?.map((shelf) => ({
            label: shelf.name,
            icon: 'pi pi-' + shelf.icon,
            routerLink: [`/shelf/${shelf.id}/books`],
            bookCount$: this.shelfService.getBookCount(shelf.id ?? 0),
          })) || [],
        },
      ])
    );

    this.homeMenu$ = this.bookService.bookState$.pipe(
      map((bookState) => {
        return [
          {
            label: 'Home',
            separator: false,
            items: [
              {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/'],
              },
              {
                label: 'All Books',
                icon: 'pi pi-fw pi-book',
                routerLink: ['/all-books'],
                bookCount$: of(bookState.books ? bookState.books.length : 0),
              },
            ],
          },
        ];
      })
    );
  }

}

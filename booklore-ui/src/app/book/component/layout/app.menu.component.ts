import { Component, OnInit } from '@angular/core';
import { AppMenuitemComponent } from './app.menuitem.component';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { LibraryService } from '../../service/library.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ShelfService } from '../../service/shelf.service';

@Component({
  selector: 'app-menu',
  imports: [AppMenuitemComponent, NgIf, NgForOf, MenuModule, AsyncPipe],
  templateUrl: './app.menu.component.html',
})
export class AppMenuComponent implements OnInit {
  home: any[] = [];
  libraryMenu$: Observable<any> | undefined;
  shelfMenu$: Observable<any> | undefined;

  constructor(private libraryService: LibraryService, private shelfService: ShelfService) {}

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

    this.populateHome();
  }

  populateHome(): void {
    this.home = [
      {
        label: 'Home',
        items: [
          { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
        ],
      },
    ];
  }
}

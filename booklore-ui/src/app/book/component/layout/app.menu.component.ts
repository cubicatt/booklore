import {Component, computed, OnInit} from '@angular/core';
import {AppMenuitemComponent} from './app.menuitem.component';
import {NgForOf, NgIf} from '@angular/common';
import {MenuModule} from 'primeng/menu';
import {LibraryAndBookService} from '../../service/library-and-book.service';

@Component({
  selector: 'app-menu',
  imports: [AppMenuitemComponent, NgIf, NgForOf, MenuModule],
  templateUrl: './app.menu.component.html',
})
export class AppMenuComponent implements OnInit {
  home: any[] = [];

  constructor(private libraryBookService: LibraryAndBookService) {
  }

  ngOnInit() {
    this.populateHome();
  }

  populateHome() {
    this.home = [
      {
        label: 'Home',
        items: [
          {label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/']},
        ],
      },
    ];
  }

  libraryMenu = computed(() => {
    const libraries = this.libraryBookService.getLibraries()();
    return [
      {
        label: 'Library',
        separator: false,
        items: libraries.map((lib) => ({
          label: lib.name,
          icon: 'pi pi-fw pi-book',
          routerLink: [`/library/${lib.id}/books`],
        })),
      },
    ];
  });

  shelfMenu = computed(() => {
    const shelves = this.libraryBookService.getShelves()();
    return [
      {
        label: 'Shelves',
        separator: false,
        items: shelves.map((shelf) => ({
          label: shelf.name,
          icon: 'pi pi-fw pi-heart',
          routerLink: [`/shelf/${shelf.id}/books`],
        })),
      },
    ];
  });
}

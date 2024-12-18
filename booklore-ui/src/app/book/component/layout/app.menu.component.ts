import {Component, computed, OnInit, Signal, WritableSignal} from '@angular/core';
import {AppMenuitemComponent} from './app.menuitem.component';
import {NgForOf, NgIf} from '@angular/common';
import {MenuModule} from 'primeng/menu';
import {LibraryService} from '../../service/library.service';
import {Library} from '../../model/library.model';

@Component({
  selector: 'app-menu',
  imports: [AppMenuitemComponent, NgIf, NgForOf, MenuModule],
  templateUrl: './app.menu.component.html',
})
export class AppMenuComponent implements OnInit {
  home: any[] = [];
  libraries: Signal<Library[]>;

  libraryMenu = computed(() => [
    {
      label: 'Library',
      separator: false,
      items: this.libraries().map((lib: Library) => ({
        label: lib.name,
        icon: 'pi pi-fw pi-home',
        routerLink: [`/library/${lib.id}/books`]
      })),
    },
  ]);

  constructor(private libraryService: LibraryService) {
    this.libraries = this.libraryService.libraries;
  }

  ngOnInit() {
    this.populateHome();
  }

  private populateHome() {
    this.home = [
      {
        label: 'Home',
        items: [
          {label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/']},
        ],
      },
    ];
  }
}

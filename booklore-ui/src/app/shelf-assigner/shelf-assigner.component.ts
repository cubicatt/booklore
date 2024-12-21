import {Component, computed, OnInit} from '@angular/core';
import {LibraryAndBookService} from '../book/service/library-and-book.service';
import {DynamicDialogConfig} from 'primeng/dynamicdialog';
import {Book} from '../book/model/book.model';

@Component({
  selector: 'app-shelf-assigner',
  standalone: false,

  templateUrl: './shelf-assigner.component.html',
  styleUrl: './shelf-assigner.component.scss'
})
export class ShelfAssignerComponent implements OnInit {

  shelves = computed(() => {
    return this.libraryBookService.shelves();
  });

  book: Book;
  selectedShelves: any[] = [];

  constructor(private libraryBookService: LibraryAndBookService, private dynamicDialogConfig: DynamicDialogConfig) {
    this.book = this.dynamicDialogConfig.data.book;
  }

  ngOnInit(): void {
    if (this.book.shelves) {
      const bookShelfIds = this.book.shelves.map(shelf => shelf.id);
      this.selectedShelves = this.shelves().filter(shelf => bookShelfIds.includes(shelf.id));
    }
  }

}

import {Component, computed, OnInit} from '@angular/core';
import {LibraryAndBookService} from '../../service/library-and-book.service';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Book} from '../../model/book.model';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-shelf-assigner',
  standalone: false,

  templateUrl: './shelf-assigner.component.html',
  styleUrl: './shelf-assigner.component.scss'
})
export class ShelfAssignerComponent implements OnInit {

  shelves;

  book: Book;
  selectedShelves: any[] = [];
  displayShelfDialog: boolean = false;
  shelfName: string = '';

  constructor(
    private libraryBookService: LibraryAndBookService, private dynamicDialogConfig: DynamicDialogConfig,
    private dynamicDialogRef: DynamicDialogRef, private messageService: MessageService) {
    this.shelves = this.libraryBookService.getShelves();
    this.book = this.dynamicDialogConfig.data.book;
  }

  ngOnInit(): void {
    if (this.book.shelves) {
      const bookShelfIds = this.book.shelves.map(shelf => shelf.id);
      this.selectedShelves = this.shelves().filter(shelf => bookShelfIds.includes(shelf.id));
    }
  }

  saveNewShelf() {
    this.libraryBookService.createShelf(this.shelfName).subscribe(
      () => {
        this.messageService.add({severity: 'info', summary: 'Success', detail: 'Shelf created: ' + this.shelfName});
        this.displayShelfDialog = false;
      },
      (error) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to create shelf'});
        console.error('Error creating shelf:', error);
      }
    );
  }

  updateBooksShelves() {
    const shelfIds = this.selectedShelves.map((shelf) => shelf.id);
    this.libraryBookService.assignShelvesToBook(this.book, shelfIds).subscribe(
      () => {
        this.messageService.add({severity: 'info', summary: 'Success', detail: 'Book\'s shelves updated'});
        this.dynamicDialogRef.close();
      },
      (error) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update book\'s shelves'});
        this.dynamicDialogRef.close();
      }
    );
  }

  createShelfDialog(): void {
    this.displayShelfDialog = true;
  }

  closeShelfDialog(): void {
    this.displayShelfDialog = false;
  }

  closeDialog() {
    this.dynamicDialogRef.close();
  }
}

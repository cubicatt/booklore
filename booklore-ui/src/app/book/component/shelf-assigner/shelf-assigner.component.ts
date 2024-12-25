import {Component, OnInit} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Book, Shelf} from '../../model/book.model';
import {MessageService} from 'primeng/api';
import {ShelfService} from '../../service/shelf.service';
import {Observable} from 'rxjs';
import {BookService} from '../../service/book.service';

@Component({
  selector: 'app-shelf-assigner',
  standalone: false,

  templateUrl: './shelf-assigner.component.html',
  styleUrl: './shelf-assigner.component.scss'
})
export class ShelfAssignerComponent implements OnInit {

  shelves$: Observable<Shelf[]>;
  book: Book;
  selectedShelves: Shelf[] = [];
  displayShelfDialog: boolean = false;
  shelfName: string = '';
  bookIds: Set<number> = new Set();
  isMultiBooks: boolean = false;

  constructor(
    private shelfService: ShelfService, private dynamicDialogConfig: DynamicDialogConfig,
    private dynamicDialogRef: DynamicDialogRef, private messageService: MessageService,
    private bookService: BookService) {
    this.shelves$ = this.shelfService.shelves$;
    this.book = this.dynamicDialogConfig.data.book;
    this.bookIds = this.dynamicDialogConfig.data.bookIds;
    this.isMultiBooks = this.dynamicDialogConfig.data.isMultiBooks;
  }

  ngOnInit(): void {
    if (!this.isMultiBooks) {
      this.shelves$.subscribe(shelves => {
        if (this.book.shelves) {
          const bookShelfIds = this.book.shelves.map(shelf => shelf.id);
          this.selectedShelves = shelves.filter(shelf => bookShelfIds.includes(shelf.id));
        }
      });
    }
  }

  saveNewShelf() {
    this.shelfService.createShelf(this.shelfName).subscribe(
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
    if (!this.isMultiBooks) {
      const shelfIds: (number | undefined)[] = this.selectedShelves.map((shelf) => shelf.id);
      this.bookService.assignShelvesToBook(new Set([this.book.id]), new Set(shelfIds), this.getIdsToUnAssign(this.book, new Set(shelfIds))).subscribe(
        () => {
          this.messageService.add({severity: 'info', summary: 'Success', detail: 'Book\'s shelves updated'});
          this.dynamicDialogRef.close();
        },
        (error) => {
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update book\'s shelves'});
          this.dynamicDialogRef.close();
        }
      );
    } else {
      const shelfIds: (number | undefined)[] = this.selectedShelves.map((shelf) => shelf.id);
      this.bookService.assignShelvesToBook(this.bookIds, new Set(shelfIds), new Set()).subscribe(
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
  }

  getIdsToUnAssign(book: Book, idsToAssign: Set<number | undefined>): Set<number | undefined> {
    const idsToUnassign = new Set<number>();
    book.shelves?.forEach(shelf => {
      if (!idsToAssign.has(shelf.id!)) {
        idsToUnassign.add(shelf.id!);
      }
    })
    return idsToUnassign;
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

import {Component, OnInit} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Book, Shelf} from '../../model/book.model';
import {MessageService} from 'primeng/api';
import {ShelfService} from '../../service/shelf.service';
import {Observable} from 'rxjs';
import {BookService} from '../../service/book.service';
import {map, tap} from 'rxjs/operators';

@Component({
  selector: 'app-shelf-assigner',
  standalone: false,
  templateUrl: './shelf-assigner.component.html',
  styleUrls: ['./shelf-assigner.component.scss']
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
    private shelfService: ShelfService,
    private dynamicDialogConfig: DynamicDialogConfig,
    private dynamicDialogRef: DynamicDialogRef,
    private messageService: MessageService,
    private bookService: BookService
  ) {
    this.shelves$ = this.shelfService.shelves$;
    this.book = this.dynamicDialogConfig.data.book;
    this.bookIds = this.dynamicDialogConfig.data.bookIds;
    this.isMultiBooks = this.dynamicDialogConfig.data.isMultiBooks;
  }

  ngOnInit(): void {
    if (!this.isMultiBooks) {
      this.shelves$.pipe(
        map(shelves => shelves.filter(shelf => this.book.shelves?.some(bShelf => bShelf.id === shelf.id))),
        tap(selectedShelves => this.selectedShelves = selectedShelves)
      ).subscribe();
    }
  }

  saveNewShelf(): void {
    this.shelfService.createShelf(this.shelfName).subscribe(
      () => {
        this.messageService.add({severity: 'info', summary: 'Success', detail: 'Shelf created: ' + this.shelfName});
        this.displayShelfDialog = false;
      },
      error => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to create shelf'});
        console.error('Error creating shelf:', error);
      }
    );
  }

  updateBooksShelves(): void {
    const idsToAssign: Set<number | undefined> = new Set(this.selectedShelves.map(shelf => shelf.id));
    const idsToUnassign: Set<number> = this.isMultiBooks ? new Set() : this.getIdsToUnAssign(this.book, idsToAssign);
    const bookIds = this.isMultiBooks ? this.bookIds : new Set([this.book.id]);
    this.updateBookShelves(bookIds, idsToAssign, idsToUnassign);
  }

  private updateBookShelves(bookIds: Set<number>, idsToAssign: Set<number | undefined>, idsToUnassign: Set<number>): void {
    this.bookService.updateBookShelves(bookIds, idsToAssign, idsToUnassign).subscribe(
      () => {
        this.messageService.add({severity: 'info', summary: 'Success', detail: 'Book shelves updated'});
        this.dynamicDialogRef.close();
      },
      error => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update book shelves'});
        this.dynamicDialogRef.close();
      }
    );
  }

  private getIdsToUnAssign(book: Book, idsToAssign: Set<number | undefined>): Set<number> {
    const idsToUnassign = new Set<number>();
    book.shelves?.forEach(shelf => {
      if (!idsToAssign.has(shelf.id!)) {
        idsToUnassign.add(shelf.id!);
      }
    });
    return idsToUnassign;
  }

  createShelfDialog(): void {
    this.displayShelfDialog = true;
  }

  closeShelfDialog(): void {
    this.displayShelfDialog = false;
  }

  closeDialog(): void {
    this.dynamicDialogRef.close();
  }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Book } from '../model/book.model';
import { MessageService } from 'primeng/api';
import { ShelfService } from '../service/shelf.service';
import { Observable } from 'rxjs';
import { BookService } from '../service/book.service';
import { map, tap } from 'rxjs/operators';
import { Shelf } from '../model/shelf.model';
import { IconPickerComponent } from '../../utilities/icon-picker/icon-picker.component';
import { ShelfState } from '../model/state/shelf-state.model';

@Component({
  selector: 'app-shelf-assigner',
  standalone: false,
  templateUrl: './shelf-assigner.component.html',
  styleUrls: ['./shelf-assigner.component.scss']
})
export class ShelfAssignerComponent implements OnInit {
  shelfState$: Observable<ShelfState>;
  book: Book;
  selectedShelves: Shelf[] = [];
  displayShelfDialog: boolean = false;
  shelfName: string = '';
  bookIds: Set<number> = new Set();
  isMultiBooks: boolean = false;
  selectedIcon: string | null = null;

  @ViewChild(IconPickerComponent) iconPicker: IconPickerComponent | undefined;

  constructor(
    private shelfService: ShelfService,
    private dynamicDialogConfig: DynamicDialogConfig,
    private dynamicDialogRef: DynamicDialogRef,
    private messageService: MessageService,
    private bookService: BookService
  ) {
    this.shelfState$ = this.shelfService.shelfState$;
    this.book = this.dynamicDialogConfig.data.book;
    this.bookIds = this.dynamicDialogConfig.data.bookIds;
    this.isMultiBooks = this.dynamicDialogConfig.data.isMultiBooks;
  }

  ngOnInit(): void {
    if (!this.isMultiBooks && this.book.shelves) {
      this.shelfState$.pipe(
        map(state => state.shelves || []),
        tap(shelves => {
          this.selectedShelves = shelves.filter(shelf =>
            this.book.shelves?.some(bShelf => bShelf.id === shelf.id)
          );
        })
      ).subscribe();
    }
  }

  saveNewShelf(): void {
    const newShelf: Partial<Shelf> = {
      name: this.shelfName,
      icon: this.selectedIcon ? this.selectedIcon.replace('pi pi-', '') : 'heart'
    };
    this.shelfService.createShelf(newShelf as Shelf).subscribe(
      () => {
        this.messageService.add({ severity: 'info', summary: 'Success', detail: `Shelf created: ${this.shelfName}` });
        this.displayShelfDialog = false;
      },
      error => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create shelf' });
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
        this.messageService.add({ severity: 'info', summary: 'Success', detail: 'Book shelves updated' });
        this.dynamicDialogRef.close();
      },
      error => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update book shelves' });
        this.dynamicDialogRef.close();
      }
    );
  }

  private getIdsToUnAssign(book: Book, idsToAssign: Set<number | undefined>): Set<number> {
    const idsToUnassign = new Set<number>();
    book.shelves?.forEach(shelf => {
      if (!idsToAssign.has(shelf.id)) {
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

  openIconPicker() {
    if (this.iconPicker) {
      this.iconPicker.open();
    }
  }

  clearSelectedIcon() {
    this.selectedIcon = null;
  }

  onIconSelected(icon: string) {
    this.selectedIcon = icon;
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { Book } from '../../model/book.model';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { ShelfAssignerComponent } from '../shelf-assigner/shelf-assigner.component';
import { BookService } from '../../service/book.service';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-book-card',
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.scss'],
  imports: [
    Button,
    MenuModule,
    CheckboxModule,
    FormsModule,
    NgIf,
  ],
})
export class BookCardComponent implements OnInit {
  @Input() book!: Book;
  @Input() onBookSelect: (book: Book, selected: boolean) => void = () => {};

  items: MenuItem[] | undefined;
  isHovered: boolean = false; // Track hover state

  constructor(
    private bookService: BookService,
    private router: Router,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.items = [
      {
        label: 'Options',
        items: [
          {
            label: 'Edit shelf',
            icon: 'pi pi-folder',
            command: () => this.openShelfDialog(this.book),
          },
          {
            label: 'View metadata',
            icon: 'pi pi-info-circle',
            command: () => this.openBookInfo(this.book),
          },
        ],
      },
    ];
  }

  coverImageSrc(book: Book): string {
    return this.bookService.getBookCoverUrl(book.id);
  }

  readBook(book: Book): void {
    this.bookService.readBook(book);
  }

  openBookInfo(book: Book): void {
    this.router.navigate(['/library', book.libraryId, 'book', book.id, 'info']);
  }

  toggleSelection(selected: boolean): void {
    this.book.selected = selected;
    this.onBookSelect(this.book, selected);  // Notify the parent component
  }

  shouldShowCheckbox(): boolean {
    return this.book.selected || this.isHovered;
  }

  private openShelfDialog(book: Book): void {
    this.dialogService.open(ShelfAssignerComponent, {
      header: `Update Shelves: ${book.metadata?.title}`,
      modal: true,
      width: '30%',
      height: '70%',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10,
      data: {
        book: this.book
      },
    });
  }
}

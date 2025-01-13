import {Component, Input, OnInit} from '@angular/core';
import {Book} from '../../../model/book.model';
import {Button} from 'primeng/button';
import {MenuModule} from 'primeng/menu';
import {MenuItem} from 'primeng/api';
import {DialogService} from 'primeng/dynamicdialog';
import {ShelfAssignerComponent} from '../../shelf-assigner/shelf-assigner.component';
import {BookService} from '../../../service/book.service';
import {CheckboxModule} from 'primeng/checkbox';
import {FormsModule} from '@angular/forms';
import {BookMetadataCenterComponent} from '../../../../metadata/book-metadata-center/book-metadata-center.component';

@Component({
  selector: 'app-book-card',
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.scss'],
  imports: [
    Button,
    MenuModule,
    CheckboxModule,
    FormsModule
  ],
})
export class BookCardComponent implements OnInit {
  @Input() book!: Book;
  @Input() isCheckboxEnabled: boolean = false;
  @Input() onBookSelect?: (bookId: number, selected: boolean) => void;
  @Input() isSelected: boolean = false;

  items: MenuItem[] | undefined;
  isHovered: boolean = false;

  constructor(private bookService: BookService, private dialogService: DialogService) {
  }

  ngOnInit(): void {
    this.initMenu();
  }

  coverImageSrc(book: Book): string {
    return this.bookService.getBookCoverUrl(book.id);
  }

  readBook(book: Book): void {
    this.bookService.readBook(book.id);
  }

  toggleSelection(selected: boolean): void {
    if (this.isCheckboxEnabled) {
      this.isSelected = selected;
      if (this.onBookSelect) {
        this.onBookSelect(this.book.id, selected);
      }
    }
  }

  private initMenu() {
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
            command: () => this.openBookDetailsDialog(this.book.id),
          },
        ],
      },
    ];
  }

  openBookDetailsDialog(bookId: number): void {
    this.bookService.getBookByIdFromAPI(bookId, true).subscribe(({
      next: (book) => {
        this.dialogService.open(BookMetadataCenterComponent, {
          header: 'Open book details',
          modal: true,
          closable: true,
          width: '1200px',
          height: '835px',
          showHeader: false,
          closeOnEscape: true,
          data: {
            book: book
          }
        });
      },
      error: (error) => {
        console.error('Error fetching book:', error);
      }
    }))
  }

  private openShelfDialog(book: Book): void {
    this.dialogService.open(ShelfAssignerComponent, {
      header: `Update Shelves: ${book.metadata?.title}`,
      modal: true,
      width: '30%',
      height: '70%',
      contentStyle: {overflow: 'auto'},
      baseZIndex: 10,
      data: {
        book: this.book
      },
    });
  }

  openBookInfo(book: Book): void {
    this.openBookDetailsDialog(book.id)
  }
}

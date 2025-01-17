import {Component, inject, Input, OnInit} from '@angular/core';
import {Book} from '../../../model/book.model';
import {Button} from 'primeng/button';
import {MenuModule} from 'primeng/menu';
import {MenuItem} from 'primeng/api';
import {DialogService} from 'primeng/dynamicdialog';
import {ShelfAssignerComponent} from '../../shelf-assigner/shelf-assigner.component';
import {BookService} from '../../../service/book.service';
import {CheckboxModule} from 'primeng/checkbox';
import {FormsModule} from '@angular/forms';
import {MetadataDialogService} from '../../../../metadata/service/metadata-dialog.service';
import {FileService} from '../../../service/file.service';


@Component({
  selector: 'app-book-card',
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.scss'],
  imports: [Button, MenuModule, CheckboxModule, FormsModule],
})
export class BookCardComponent implements OnInit {
  @Input() book!: Book;
  @Input() isCheckboxEnabled: boolean = false;
  @Input() onBookSelect?: (bookId: number, selected: boolean) => void;
  @Input() isSelected: boolean = false;

  items: MenuItem[] | undefined;
  isHovered: boolean = false;

  private fileService = inject(FileService);
  private bookService = inject(BookService);
  private dialogService = inject(DialogService);
  private metadataDialogService = inject(MetadataDialogService);

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
            command: () => this.metadataDialogService.openBookDetailsDialog(this.book.id),
          },
          {
            label: 'Download',
            icon: 'pi pi-download',
            command: () => {
              this.fileService.downloadFile(this.book.id)
            },
          },
        ],
      },
    ];
  }

  private openShelfDialog(book: Book): void {
    this.dialogService.open(ShelfAssignerComponent, {
      header: `Update Shelves: ${book.metadata?.title}`,
      modal: true,
      closable: true,
      contentStyle: {overflow: 'auto'},
      baseZIndex: 10,
      style: {
        position: 'absolute',
        top: '15%',
      },
      data: {
        book: this.book
      },
    });
  }

  openBookInfo(book: Book): void {
    this.metadataDialogService.openBookDetailsDialog(book.id);
  }
}

import {Component, OnInit} from '@angular/core';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {BookDetailsComponent} from './book-details/book-details.component';
import {DynamicDialogConfig} from 'primeng/dynamicdialog';
import {BookService} from '../book/service/book.service';
import {Book} from '../book/model/book.model';
import {BookMetadataForm} from '../book/model/book-metadata-form';
import {MessageService} from 'primeng/api';
import {BookMatchComponent} from './book-match/book-match.component';

@Component({
  selector: 'book-info-tabs',
  standalone: true,
  templateUrl: './book-info-tabs.component.html',
  styleUrl: './book-info-tabs.component.scss',
  imports: [
    Tabs,
    TabList,
    Tab,
    TabPanels,
    BookDetailsComponent,
    BookMatchComponent,
    TabPanel
  ]
})
export class BookInfoTabsComponent implements OnInit {
  book: Book | undefined;
  metadataForm: BookMetadataForm = {} as BookMetadataForm;

  constructor(private bookService: BookService, private dynamicDialogConfig: DynamicDialogConfig,
              private messageService: MessageService) {}

  ngOnInit(): void {
    this.bookService.getBookByIdFromAPI(this.dynamicDialogConfig.data.bookId, true).subscribe({
      next: (book) => {
        this.book = book;
        this.initializeBookForm();
      },
      error: (error) => {
      }
    });
  }

  private initializeBookForm(): void {
    if (this.book?.metadata) {
      this.metadataForm = {
        ...this.book.metadata,
        authors: this.book.metadata.authors?.map(a => a.name) || [],
        categories: this.book.metadata.categories?.map(c => c.name) || []
      };
    }
  }

  saveBook(bookMetadataForm: BookMetadataForm) {
    console.log(bookMetadataForm)
    this.bookService.updateMetadataV2(this.book?.id!, bookMetadataForm).subscribe({
      next: () => {
        this.messageService.add({severity: 'info', summary: 'Success', detail: 'Book metadata updated'});
      },
      error: (error) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update book metadata'});
      }
    });
  }
}

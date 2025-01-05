import {Component, OnInit} from '@angular/core';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {BookDetailsComponent} from './book-details/book-details.component';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {BookService} from '../book/service/book.service';
import {MessageService} from 'primeng/api';
import {BookMatchComponent} from './book-match/book-match.component';
import {BookInfoService} from './book-info.service';
import {Book} from '../book/model/book.model';
import {BookMetadataBI} from '../book/model/book-metadata-for-book-info.model';
import {BookMetadataViewerComponent} from './book-metadata-viewer/book-metadata-viewer.component';

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
    TabPanel,
    BookMatchComponent,
    BookMetadataViewerComponent,
  ],
})
export class BookInfoTabsComponent implements OnInit {

  constructor(private dynamicDialogConfig: DynamicDialogConfig, private dynamicDialogRef: DynamicDialogRef, private bookInfoService: BookInfoService) {
  }

  ngOnInit(): void {
    const initialBook = this.dynamicDialogConfig.data.book;
    if (initialBook?.metadata) {
      this.bookInfoService.emit(this.convertToBookMetadataBI(initialBook));
    }
    this.bookInfoService.dialogClose$.subscribe((close) => {
      if(close) {
        this.bookInfoService.closeDialog(false);
        this.dynamicDialogRef.close();
      }
    })
  }

  private convertToBookMetadataBI(book: Book): BookMetadataBI {
    const metadata = book.metadata;
    return {
      bookId: book.id,
      title: metadata?.title || '',
      subtitle: metadata?.subtitle,
      authors: metadata?.authors?.map((author) => author.name) || [],
      categories: metadata?.categories?.map((category) => category.name) || [],
      publisher: metadata?.publisher || '',
      publishedDate: metadata?.publishedDate || '',
      isbn10: metadata?.isbn10 || '',
      isbn13: metadata?.isbn13 || '',
      description: metadata?.description,
      pageCount: metadata?.pageCount || null,
      reviewCount: metadata?.reviewCount || null,
      rating: metadata?.rating || null,
      language: metadata?.language || '',
      googleBookId: metadata?.googleBookId || '',
    };
  }
}

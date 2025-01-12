import {Component, OnInit} from '@angular/core';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {MetadataEditorComponent} from './metadata-editor/metadata-editor.component';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {MetadataSearcherComponent} from './metadata-searcher/metadata-searcher.component';
import {BookMetadataCenterService} from './book-metadata-center.service';
import {Book} from '../../book/model/book.model';
import {BookMetadataBI} from '../model/book-metadata-for-book-info.model';
import {MetadataViewerComponent} from './metadata-viewer/metadata-viewer.component';

@Component({
  selector: 'app-book-metadata-center',
  standalone: true,
  templateUrl: './book-metadata-center.component.html',
  styleUrl: './book-metadata-center.component.scss',
  imports: [
    Tabs,
    TabList,
    Tab,
    TabPanels,
    MetadataEditorComponent,
    TabPanel,
    MetadataSearcherComponent,
    MetadataViewerComponent,
  ],
})
export class BookMetadataCenterComponent implements OnInit {

  constructor(private dynamicDialogConfig: DynamicDialogConfig, private dynamicDialogRef: DynamicDialogRef, private bookInfoService: BookMetadataCenterService) {
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
    };
  }
}

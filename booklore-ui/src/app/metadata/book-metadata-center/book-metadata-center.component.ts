import {Component, inject, OnInit} from '@angular/core';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {MetadataEditorComponent} from './metadata-editor/metadata-editor.component';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {MetadataSearcherComponent} from './metadata-searcher/metadata-searcher.component';
import {BookMetadataCenterService} from './book-metadata-center.service';
import {MetadataViewerComponent} from './metadata-viewer/metadata-viewer.component';

@Component({
  selector: 'app-book-metadata-center',
  standalone: true,
  templateUrl: './book-metadata-center.component.html',
  styleUrl: './book-metadata-center.component.scss',
  imports: [Tabs, TabList, Tab, TabPanels, MetadataEditorComponent, TabPanel, MetadataSearcherComponent, MetadataViewerComponent],
})
export class BookMetadataCenterComponent implements OnInit {

  private dynamicDialogConfig = inject(DynamicDialogConfig);
  private dynamicDialogRef = inject(DynamicDialogRef);
  private metadataCenterService = inject(BookMetadataCenterService);

  ngOnInit(): void {
    const book = this.dynamicDialogConfig.data.book;
    if (book?.metadata) {
      this.metadataCenterService.emit(book.metadata);
    }
    this.metadataCenterService.dialogClose$.subscribe((close) => {
      if (close) {
        this.metadataCenterService.closeDialog(false);
        this.dynamicDialogRef.close();
      }
    })
  }
}

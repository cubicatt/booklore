import {Routes} from '@angular/router';
import {PdfViewerComponent} from './book/components/pdf-viewer/pdf-viewer.component';
import {BookBrowserComponent} from './book/components/book-browser/book-browser.component';
import {EpubViewerComponent} from './epub-viewer/component/epub-viewer.component';

export const routes: Routes = [
  {
    path: '', component: EpubViewerComponent,
    children: [
      {
        path: '', component: EpubViewerComponent,
      },
      {
        path: 'all-books', component: BookBrowserComponent,
      },
      {
        path: 'library/:libraryId/books', component: BookBrowserComponent,
      },
      {
        path: 'shelf/:shelfId/books', component: BookBrowserComponent,
      }
    ]
  },
  {
    path: 'pdf-viewer/book/:bookId',
    component: PdfViewerComponent
  }
];

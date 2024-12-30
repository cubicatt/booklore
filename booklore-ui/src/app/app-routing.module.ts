import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PdfViewerComponent} from './book/component/pdf-viewer/pdf-viewer.component';
import {DashboardComponent} from './book/component/dashboard/dashboard.component';
import {BookMetadataComponent} from './book/component/book-metadata/book-metadata.component';
import {BookBrowserComponent} from './book/component/book-browser/book-browser.component';
import {AppLayoutComponent} from './book/component/layout/app.layout.component';

const routes: Routes = [
  {
    path: '', component: AppLayoutComponent,
    children: [
      {
        path: '', component: DashboardComponent,
      },
      {
        path: 'library/:libraryId/books', component: BookBrowserComponent,
      },
      {
        path: 'shelf/:shelfId/books', component: BookBrowserComponent,
      },
      {
        path: 'library/:libraryId/book/:bookId/info', component: BookMetadataComponent,
      }
    ]
  },
  {
    path: 'pdf-viewer/book/:bookId',
    component: PdfViewerComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

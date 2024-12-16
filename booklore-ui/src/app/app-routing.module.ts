import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AppLayoutComponent} from './layout/app.layout.component';
import {LibraryBrowserComponent} from './book/component/library-browser/library-browser.component';
import {PdfViewerComponent} from './book/component/pdf-viewer/pdf-viewer.component';
import {DashboardComponent} from './book/component/dashboard/dashboard.component';
import {BookMetadataComponent} from './book-metadata/book-metadata.component';

const routes: Routes = [
  {
    path: '', component: AppLayoutComponent,
    children: [
      {
        path: '', component: DashboardComponent,
      },
      {
        path: 'library/:libraryId/books', component: LibraryBrowserComponent,
      },
      {
        path: 'book/:bookId/info', component: BookMetadataComponent,
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

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PdfViewerComponent} from './book/pdf-viewer/pdf-viewer.component';
import {MainDashboardComponent} from './dashboard/main-dashboard/main-dashboard.component';
import {BookBrowserComponent} from './book/book-browser/book-browser.component';
import {AppLayoutComponent} from './layout/app.layout.component';

const routes: Routes = [
  {
    path: '', component: AppLayoutComponent,
    children: [
      {
        path: '', component: MainDashboardComponent,
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

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

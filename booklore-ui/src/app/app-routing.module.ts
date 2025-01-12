import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PdfViewerComponent} from './book/components/pdf-viewer/pdf-viewer.component';
import {MainDashboardComponent} from './dashboard/components/main-dashboard/main-dashboard.component';
import {BookBrowserComponent} from './book/components/book-browser/book-browser.component';
import {AppLayoutComponent} from './layout/component/layout-main/app.layout.component';

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

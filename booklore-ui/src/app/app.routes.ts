import { Routes } from '@angular/router';
import { PdfViewerComponent } from './book/components/pdf-viewer/pdf-viewer.component';
import { BookBrowserComponent } from './book/components/book-browser/book-browser.component';
import { MainDashboardComponent } from './dashboard/components/main-dashboard/main-dashboard.component';
import { AppLayoutComponent } from './layout/component/layout-main/app.layout.component';
import { EpubViewerComponent } from './epub-viewer/component/epub-viewer.component';
import { SettingsComponent } from './core/component/settings/settings.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: '', component: MainDashboardComponent, canActivate: [AuthGuard] },
      { path: 'all-books', component: BookBrowserComponent, canActivate: [AuthGuard] },
      { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
      { path: 'library/:libraryId/books', component: BookBrowserComponent, canActivate: [AuthGuard] },
      { path: 'shelf/:shelfId/books', component: BookBrowserComponent, canActivate: [AuthGuard] },
    ]
  },
  {
    path: 'pdf-viewer/book/:bookId',
    component: PdfViewerComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'epub-viewer/book/:bookId',
    component: EpubViewerComponent,
    canActivate: [AuthGuard]
  },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];

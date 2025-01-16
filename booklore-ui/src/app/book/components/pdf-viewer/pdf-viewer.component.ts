import {Component, inject, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgxExtendedPdfViewerModule, ScrollModeType} from 'ngx-extended-pdf-viewer';
import {BookService} from '../../service/book.service';
import {AppSettingsService} from '../../../core/service/app-settings.service';
import {forkJoin, Observable, of, Subscription} from 'rxjs';
import {BookState} from '../../model/state/book-state.model';
import {AppSettings} from '../../../core/model/app-settings.model';
import {catchError, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [NgxExtendedPdfViewerModule],
  templateUrl: './pdf-viewer.component.html',
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  bookId!: number;
  handTool = true;
  page = 1;
  rotation: 0 | 90 | 180 | 270 = 0;
  scrollMode: ScrollModeType = ScrollModeType.page;
  sidebarVisible!: boolean;
  spread!: 'off' | 'even' | 'odd';
  zoom!: number | string;
  private isInitialLoad = true;
  bookData!: string | Blob;
  private appSettingsSubscription!: Subscription;

  private bookService = inject(BookService);
  private appSettingsService = inject(AppSettingsService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.bookId = +params.get('bookId')!;
      this.loadBook(this.bookId);
      this.updateLastReadTime();
    });
  }

  private loadBook(bookId: number): void {
    this.appSettingsSubscription = this.appSettingsService.appSettings$.subscribe((appSettings) => {
      if (appSettings) {
        this.bookService.getBookSetting(bookId).subscribe({
          next: (bookSetting) => {
            const {pageNumber, zoom, sidebar_visible, spread} = bookSetting;
            this.page = pageNumber || 1;
            this.zoom = zoom || appSettings.pdf?.zoom || 'page-fit';
            this.sidebarVisible = sidebar_visible ?? appSettings.pdf?.sidebar ?? false;
            this.spread = spread || appSettings.pdf?.spread || 'odd';
            this.isInitialLoad = false;
            this.bookService.getBookData(bookId).subscribe({
              next: (bookData) => {
                this.bookData = bookData;
              },
              error: (e) => {
                console.error('Error loading book data:', e);
              },
            });
          },
          error: (e) => {
            console.error('Error loading book settings:', e);
          },
        });
      }
    });
  }

  private updateLastReadTime(): void {
    this.bookService.updateLastReadTime(this.bookId).subscribe();
  }

  onPageChange(page: number): void {
    if (page !== this.page) {
      this.page = page;
      this.updateViewerSetting();
    }
  }

  onZoomChange(zoom: string | number): void {
    if (zoom !== this.zoom) {
      this.zoom = zoom;
      this.updateViewerSetting();
    }
  }

  onSidebarVisibleChange(visible: boolean): void {
    if (visible !== this.sidebarVisible) {
      this.sidebarVisible = visible;
      this.updateViewerSetting();
    }
  }

  onSpreadChange(spread: 'off' | 'even' | 'odd'): void {
    if (spread !== this.spread) {
      this.spread = spread;
      this.updateViewerSetting();
    }
  }

  private updateViewerSetting(): void {
    if (this.isInitialLoad) return;
    const updatedViewerSetting = {
      sidebar_visible: this.sidebarVisible,
      spread: this.spread,
      zoom: this.zoom,
    };
    this.bookService.updateViewerSetting(updatedViewerSetting, this.bookId).subscribe();
  }

  ngOnDestroy(): void {
    this.updateLastReadTime();
    if (this.appSettingsSubscription) {
      this.appSettingsSubscription.unsubscribe();
    }
  }
}

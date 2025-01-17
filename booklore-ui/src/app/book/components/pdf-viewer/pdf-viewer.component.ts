import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgxExtendedPdfViewerModule, ScrollModeType} from 'ngx-extended-pdf-viewer';
import {BookService} from '../../service/book.service';
import {AppSettingsService} from '../../../core/service/app-settings.service';
import {filter, forkJoin, Subscription, take} from 'rxjs';
import {PdfViewerSetting} from '../../model/book.model';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [NgxExtendedPdfViewerModule],
  templateUrl: './pdf-viewer.component.html',
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  handTool = true;
  rotation: 0 | 90 | 180 | 270 = 0;
  scrollMode: ScrollModeType = ScrollModeType.page;

  sidebarVisible!: boolean;
  page!: number;
  spread!: 'off' | 'even' | 'odd';
  zoom!: number | string;

  private isInitialLoad = true;
  bookData!: string | Blob;
  bookId!: number;
  private appSettingsSubscription!: Subscription;

  private bookService = inject(BookService);
  private appSettingsService = inject(AppSettingsService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.bookId = +params.get('bookId')!;
      this.appSettingsService.appSettings$
        .pipe(
          filter((appSettings) => appSettings !== null),
          take(1))
        .subscribe((appSettings) => {
          const book$ = this.bookService.getBookByIdFromAPI(this.bookId, false);
          const pdf$ = this.bookService.getPdfData(this.bookId);
          const bookSetting$ = this.bookService.getBookSetting(this.bookId);

          forkJoin([book$, pdf$, bookSetting$]).subscribe((results) => {
            const pdf = results[0];
            const pdfData = results[1];
            const individualPdfSettings = results[2]?.pdfSettings;
            const globalPdfSettings = appSettings.pdf;

            console.log(individualPdfSettings);
            console.log(globalPdfSettings);

            this.page = pdf.pdfProgress || 1;
            this.zoom = individualPdfSettings?.zoom || globalPdfSettings?.zoom || 'page-fit';
            this.sidebarVisible = individualPdfSettings?.sidebarVisible ?? globalPdfSettings?.sidebar ?? true;
            this.spread = individualPdfSettings?.spread || globalPdfSettings?.spread || 'odd';

            this.isInitialLoad = false;
            this.bookData = pdfData;
            this.updateLastReadTime();
          });
        });
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
    const updatedViewerSetting: PdfViewerSetting = {
      sidebarVisible: this.sidebarVisible,
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

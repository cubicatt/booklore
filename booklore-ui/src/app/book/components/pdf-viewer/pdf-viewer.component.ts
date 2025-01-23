import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgxExtendedPdfViewerModule, PdfLoadedEvent, ScrollModeType} from 'ngx-extended-pdf-viewer';
import {BookService} from '../../service/book.service';
import {AppSettingsService} from '../../../core/service/app-settings.service';
import {filter, forkJoin, Subscription, take} from 'rxjs';
import {BookSetting, PdfViewerSetting} from '../../model/book.model';
import {PdfSettings} from '../../../core/model/app-settings.model';

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

  private pdfLoaded = false;
  bookData!: string | Blob;
  bookId!: number;
  private appSettingsSubscription!: Subscription;

  private bookService = inject(BookService);
  private appSettingsService = inject(AppSettingsService);
  private route = inject(ActivatedRoute);

  private individualPdfSettings: PdfViewerSetting | undefined;
  private globalPdfSettings: PdfSettings | undefined;
  private pdfScope: 'global' | 'individual' | undefined;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.bookId = +params.get('bookId')!;

      this.appSettingsService.appSettings$
        .pipe(
          filter((appSettings) => appSettings !== null),
          take(1)
        )
        .subscribe((appSettings) => {
          const book$ = this.bookService.getBookByIdFromAPI(this.bookId, false);
          const pdf$ = this.bookService.getPdfData(this.bookId);
          const bookSetting$ = this.bookService.getBookSetting(this.bookId);

          forkJoin([book$, pdf$, bookSetting$]).subscribe((results) => {
            const pdf = results[0];
            const pdfData = results[1];
            this.individualPdfSettings = results[2]?.pdfSettings;
            this.globalPdfSettings = appSettings.pdf;
            this.pdfScope = appSettings?.readerSettings?.pdfScope;
            this.page = pdf.pdfProgress || 1;
            this.bookData = pdfData;
          });
        });
    });
  }

  onPageChange(page: number): void {
    if (!this.pdfLoaded) return;
    if (page !== this.page) {
      this.page = page;
    }
    this.updateProgress();
  }

  onZoomChange(zoom: string | number): void {
    if (!this.pdfLoaded) return;
    if (zoom !== this.zoom) {
      this.zoom = zoom;
      this.updateViewerSetting();
    }
  }

  onSidebarVisibleChange(visible: boolean): void {
    if (!this.pdfLoaded) return;
    if (visible !== this.sidebarVisible) {
      this.sidebarVisible = visible;
      this.updateViewerSetting();
    }
  }

  onSpreadChange(spread: 'off' | 'even' | 'odd'): void {
    if (!this.pdfLoaded) return;
    if (spread !== this.spread) {
      this.spread = spread;
      this.updateViewerSetting();
    }
  }

  private updateViewerSetting(): void {
    if (!this.pdfLoaded) return;
    const bookSetting: BookSetting = {
      pdfSettings: {
        sidebarVisible: this.sidebarVisible,
        spread: this.spread,
        zoom: this.zoom,
      }
    }
    this.bookService.updateViewerSetting(bookSetting, this.bookId).subscribe();
  }

  updateProgress() {
    this.bookService.savePdfProgress(this.bookId, this.page).subscribe();
  }

  ngOnDestroy(): void {
    if (this.appSettingsSubscription) {
      this.appSettingsSubscription.unsubscribe();
    }
    this.updateProgress();
  }

  onPdfLoaded($event: PdfLoadedEvent) {
    this.pdfLoaded = true;
    this.updateProgress();
    if (this.pdfScope === 'global') {
      this.zoom = this.globalPdfSettings?.zoom || 'page-fit';
      this.sidebarVisible = this.globalPdfSettings?.sidebar ?? true;
      this.spread = this.globalPdfSettings?.spread || 'odd';
    } else {
      this.zoom = this.individualPdfSettings?.zoom || this.globalPdfSettings?.zoom || 'page-fit';
      this.sidebarVisible = this.individualPdfSettings?.sidebarVisible ?? this.globalPdfSettings?.sidebar ?? true;
      this.spread = this.individualPdfSettings?.spread || this.globalPdfSettings?.spread || 'odd';
    }
  }
}

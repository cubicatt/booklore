import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgxExtendedPdfViewerModule, ScrollModeType} from 'ngx-extended-pdf-viewer';
import {BookService} from '../service/book.service';

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
  sidebarVisible = false;
  spread: 'off' | 'even' | 'odd' = 'odd';
  src = '';
  zoom: number | string = 'page-fit';
  private isInitialLoad = true;

  constructor(
    private bookService: BookService,
    private zone: NgZone,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.bookId = +params.get('bookId')!;
      this.loadBook(this.bookId);
      this.updateLastReadTime();
    });
  }

  ngOnDestroy(): void {
    this.updateLastReadTime();
  }

  private loadBook(bookId: number): void {
    this.bookService.getBookById(bookId).subscribe((book) => {
      this.zone.run(() => {
        this.bookService.getBookSetting(bookId).subscribe((bookSetting) => {
          const { pageNumber, zoom, sidebar_visible, spread } = bookSetting;
          this.page = pageNumber || 1;
          this.zoom = zoom || 'page-fit';
          this.sidebarVisible = sidebar_visible || false;
          this.spread = spread || 'odd';
          this.isInitialLoad = false;
        });
      });
    });
  }

  private updateViewerSetting(): void {
    if (this.isInitialLoad) return;
    const updatedViewerSetting = {
      pageNumber: this.page,
      zoom: this.zoom,
      sidebar_visible: this.sidebarVisible,
      spread: this.spread,
    };
    this.bookService.updateViewerSetting(updatedViewerSetting, this.bookId).subscribe();
  }

  private updateLastReadTime(): void {
    this.bookService.updateLastReadTime(this.bookId).subscribe();
  }

  onPageChange(page: number): void {
    console.log('page', page);
    if (page !== this.page) {
      this.page = page;
      this.updateViewerSetting();
    }
  }

  onZoomChange(zoom: string | number): void {
    console.log('zoom', zoom);
    if (zoom !== this.zoom) {
      this.zoom = zoom;
      this.updateViewerSetting();
    }
  }

  onSidebarVisibleChange(visible: boolean): void {
    console.log('sidebarVisible', visible);
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

  getSrc(): string {
    return this.bookService.getBookDataUrl(this.bookId);
  }
}

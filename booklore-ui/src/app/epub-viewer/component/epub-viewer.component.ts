import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import ePub from 'epubjs';
import {EpubService} from '../service/epub.service';
import {Drawer} from 'primeng/drawer';
import {Button} from 'primeng/button';
import {NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Divider} from 'primeng/divider';
import {ActivatedRoute} from '@angular/router';
import {Book, BookSetting, EpubViewerSetting} from '../../book/model/book.model';
import {BookService} from '../../book/service/book.service';
import {filter, forkJoin, take} from 'rxjs';
import {AppSettingsService} from '../../core/service/app-settings.service';
import {Select} from 'primeng/select';

const FALLBACK_EPUB_SETTINGS = {
  fontSize: 150,
  fontType: 'serif',
  theme: 'white',
  maxFontSize: 300,
  minFontSize: 50,
};

@Component({
  selector: 'app-epub-viewer',
  templateUrl: './epub-viewer.component.html',
  styleUrls: ['./epub-viewer.component.scss'],
  imports: [Drawer, Button, NgForOf, FormsModule, Divider, Select],
})
export class EpubViewerComponent implements OnInit, OnDestroy {
  @ViewChild('epubContainer', { static: true }) epubContainer!: ElementRef;

  chapters: { label: string; href: string }[] = [];
  isDrawerVisible = false;
  isSettingsDrawerVisible = false;
  private book: any;
  private rendition: any;
  private keyListener: (e: KeyboardEvent) => void = () => {};

  fontSize = FALLBACK_EPUB_SETTINGS.fontSize;
  selectedFontType = FALLBACK_EPUB_SETTINGS.fontType;
  selectedTheme = FALLBACK_EPUB_SETTINGS.theme;

  fontTypes: any[] = [
    { label: 'Serif', value: 'serif' },
    { label: 'Sans Serif', value: 'sans-serif' },
    { label: 'Roboto', value: 'roboto' },
    { label: 'Cursive', value: 'cursive' },
    { label: 'Monospace', value: 'monospace' },
  ];

  themes: any[] = [
    { label: 'White', value: 'white' },
    { label: 'Black', value: 'black' },
    { label: 'Grey', value: 'grey' },
    { label: 'Sepia', value: 'sepia' },
  ];

  private epubService = inject(EpubService);
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private appSettingsService = inject(AppSettingsService);

  epub!: Book;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const bookId = +params.get('bookId')!;
      this.appSettingsService.appSettings$
        .pipe(filter((appSettings) => appSettings !== null), take(1))
        .subscribe((appSettings) => {
          const epub$ = this.bookService.getBookByIdFromAPI(bookId, false);
          const epubData$ = this.epubService.downloadEpub(bookId);
          const bookSetting$ = this.bookService.getBookSetting(bookId);

          forkJoin([epub$, epubData$, bookSetting$]).subscribe((results) => {
            const epub = results[0];
            const epubData = results[1];
            const individualSetting = results[2]?.epubSettings;
            const globalSetting = appSettings.epub;

            console.log(individualSetting)
            console.log(globalSetting)

            this.epub = epub;
            const fileReader = new FileReader();

            fileReader.onload = () => {
              this.book = ePub(fileReader.result as ArrayBuffer);

              this.book.loaded.navigation.then((nav: any) => {
                this.chapters = nav.toc.map((chapter: any) => ({
                  label: chapter.label,
                  href: chapter.href,
                }));
              });

              this.rendition = this.book.renderTo(this.epubContainer.nativeElement, {
                flow: 'paginated',
                width: '100%',
                height: '100%',
                allowScriptedContent: true,
              });

              this.selectedTheme = individualSetting?.theme || globalSetting?.theme || FALLBACK_EPUB_SETTINGS.theme;
              this.selectedFontType = individualSetting?.font || globalSetting?.font || FALLBACK_EPUB_SETTINGS.fontType;
              this.fontSize = individualSetting?.fontSize || globalSetting?.fontSize || FALLBACK_EPUB_SETTINGS.fontSize;

              this.applyViewerSettings();
              this.setupKeyListener();
              this.trackProgress();
            };

            fileReader.readAsArrayBuffer(epubData);
          });
        });
    });
  }

  private applyViewerSettings(): void {
    this.changeFontType();
    this.updateFontSize();
    this.changeThemes();
  }

  updateFontSize(): void {
    if (this.rendition) {
      this.rendition.themes.fontSize(`${this.fontSize}%`);
      this.updateViewerSetting();
    }
  }

  increaseFontSize(): void {
    this.fontSize = Math.min(this.fontSize + 10, FALLBACK_EPUB_SETTINGS.maxFontSize);
    this.updateFontSize();
  }

  decreaseFontSize(): void {
    this.fontSize = Math.max(this.fontSize - 10, FALLBACK_EPUB_SETTINGS.minFontSize);
    this.updateFontSize();
  }

  changeFontType(): void {
    if (this.rendition) {
      this.rendition.themes.font(this.selectedFontType);
      this.updateViewerSetting();
    }
  }

  changeThemes(): void {
    if (this.rendition) {
      this.rendition.themes.select(this.selectedTheme);
      this.rendition.clear();
      this.rendition.start();
      this.updateViewerSetting();
    }
  }

  private updateViewerSetting(): void {
    const bookSetting: BookSetting = {
      epubSettings: {
        theme: this.selectedTheme,
        font: this.selectedFontType,
        fontSize: this.fontSize,
      }
    }
    this.bookService.updateViewerSetting(bookSetting, this.epub.id).subscribe();
  }

  private setupKeyListener(): void {
    this.keyListener = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        this.prevPage();
      } else if (e.key === 'ArrowRight') {
        this.nextPage();
      }
    };
    document.addEventListener('keyup', this.keyListener);
  }

  private trackProgress(): void {
    if (this.rendition) {
      this.rendition.on('relocated', (location: any) => {
        this.bookService.saveEpubProgress(this.epub.id, location.start.cfi).subscribe();
      });
    }
  }

  prevPage(): void {
    if (this.rendition) {
      this.rendition.prev();
    }
  }

  nextPage(): void {
    if (this.rendition) {
      this.rendition.next();
    }
  }

  navigateToChapter(chapter: { label: string; href: string }): void {
    if (this.book && chapter.href) {
      this.book.rendition.display(chapter.href);
    }
  }

  toggleDrawer(): void {
    this.isDrawerVisible = !this.isDrawerVisible;
  }

  toggleSettingsDrawer(): void {
    this.isSettingsDrawerVisible = !this.isSettingsDrawerVisible;
  }

  ngOnDestroy(): void {
    if (this.rendition) {
      this.rendition.off('keyup', this.keyListener);
    }
    document.removeEventListener('keyup', this.keyListener);
  }
}

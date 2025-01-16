import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import ePub from 'epubjs';
import {EpubService} from '../service/epub.service';
import {Drawer} from 'primeng/drawer';
import {Button} from 'primeng/button';
import {NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Divider} from 'primeng/divider';
import {ActivatedRoute} from '@angular/router';
import {Book} from '../../book/model/book.model';
import {BookService} from '../../book/service/book.service';
import {forkJoin} from 'rxjs';
import {AppSettingsService} from '../../core/service/app-settings.service';
import {Select} from 'primeng/select';

@Component({
  selector: 'app-epub-viewer',
  templateUrl: './epub-viewer.component.html',
  styleUrls: ['./epub-viewer.component.scss'],
  imports: [Drawer, Button, NgForOf, FormsModule, Divider, Select]
})
export class EpubViewerComponent implements OnInit, OnDestroy {

  @ViewChild('epubContainer', {static: true}) epubContainer!: ElementRef;
  chapters: { label: string; href: string }[] = [];
  isDrawerVisible = false;
  isSettingsDrawerVisible: boolean = false;
  private book: any;
  private rendition: any;
  private keyListener: (e: KeyboardEvent) => void = () => {
  };
  fontSize: number = 120;

  epub!: Book;

  fontTypes: any[] = [
    {label: 'Serif', value: 'serif'},
    {label: 'Sans Serif', value: 'sans-serif'},
    {label: 'Roboto', value: 'roboto'},
    {label: 'Cursive', value: 'cursive'},
    {label: 'Monospace', value: 'monospace'}
  ];
  selectedFontType: string = 'serif';

  selectedTheme: string = 'white';
  themes: any[] = [
    {label: 'White', value: 'white'},
    {label: 'Black', value: 'black'},
    {label: 'Grey', value: 'grey'},
    {label: 'Sepia', value: 'sepia'}
  ];

  private epubService = inject(EpubService);
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private appSettingsService = inject(AppSettingsService);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      let book$ = this.bookService.getBookByIdFromAPI(+params.get('bookId')!, false);
      let epub$ = this.epubService.downloadEpub(+params.get('bookId')!);
      forkJoin([book$, epub$]).subscribe(results => {
        this.epub = results[0];

        const fileReader = new FileReader();
        fileReader.onload = () => {
          const epubData = fileReader.result as ArrayBuffer;
          this.book = ePub(epubData);

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

          if (this.epub?.epubProgress) {
            this.rendition.display(this.epub.epubProgress);
          } else {
            this.rendition.display();
          }

          this.themesMap.forEach((theme, name) => {
            this.rendition.themes.register(name, theme);
          });

          this.setupKeyListener();
          this.trackProgress();
          this.subscribeToSettings();
        };
        fileReader.readAsArrayBuffer(results[1]);
      })

    });
  }

  private subscribeToSettings(): void {
    this.appSettingsService.appSettings$.subscribe((settings) => {
      if (settings) {
        if (settings.epub) {
          this.selectedTheme = settings.epub.theme || 'white';
          this.selectedFontType = settings.epub.font || 'serif';
          this.fontSize = parseInt(settings.epub.fontSize, 10) || 120;
          this.changeFontType();
          this.updateFontSize();
          this.changeThemes();
        }
      }
    });
  }

  private trackProgress(): void {
    if (this.rendition) {
      this.rendition.on('relocated', (location: any) => {
        this.bookService.saveEpubProgress(this.epub.id, location.start.cfi).subscribe({
          next: () => {
          },
          error: () => {
          }
        })
      });
    }
  }

  updateFontSize(): void {
    if (this.rendition) {
      this.rendition.themes.fontSize(`${this.fontSize}%`);
    }
  }

  increaseFontSize(): void {
    this.fontSize += 10;
    if (this.fontSize > 300) {
      this.fontSize = 300;
    }
    this.updateFontSize();
  }

  decreaseFontSize(): void {
    this.fontSize -= 10;
    if (this.fontSize < 50) {
      this.fontSize = 50;
    }
    this.updateFontSize();
  }

  changeFontType(): void {
    if (this.rendition) {
      this.rendition.themes.font(this.selectedFontType);
    }
  }

  changeThemes() {
    if (this.rendition) {
      this.rendition.themes.select(this.selectedTheme);
      this.rendition.clear();
      this.rendition.start();
    }
  }

  navigateToChapter(chapter: { label: string; href: string }): void {
    if (this.book && chapter.href) {
      this.book.rendition.display(chapter.href);
    }
  }

  nextPage(): void {
    if (this.rendition) {
      this.rendition.next();
    }
  }

  prevPage(): void {
    if (this.rendition) {
      this.rendition.prev();
    }
  }

  toggleDrawer(): void {
    this.isDrawerVisible = !this.isDrawerVisible;
  }

  toggleSettingsDrawer(): void {
    this.isSettingsDrawerVisible = !this.isSettingsDrawerVisible;
  }

  private setupKeyListener(): void {
    this.keyListener = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          this.prevPage();
          break;
        case 'ArrowRight':
          this.nextPage();
          break;
        default:
          break;
      }
    };
    if (this.rendition) {
      this.rendition.on('keyup', this.keyListener);
    }
    document.addEventListener('keyup', this.keyListener);
  }

  ngOnDestroy(): void {
    if (this.rendition) {
      this.rendition.off('keyup', this.keyListener);
    }
    document.removeEventListener('keyup', this.keyListener);
  }

  themesMap = new Map<string, any>([
    [
      'black', {
      "body": {"background-color": "#000000", "color": "#f9f9f9", "font-family": "Arial, sans-serif"},
      "p": {"color": "#f9f9f9"},
      "h1, h2, h3, h4, h5, h6": {"color": "#f9f9f9"},
      "a": {"color": "#f9f9f9"},
      "img": {
        "-webkit-filter": "invert(1) hue-rotate(180deg)",
        "filter": "invert(1) hue-rotate(180deg)"
      },
      "code": {"color": "#00ff00", "background-color": "black"}
    }
    ],
    [
      'sepia', {
      "body": {"background-color": "#f4ecd8", "color": "#6e4b3a", "font-family": "Georgia, serif"},
      "p": {"color": "#6e4b3a"},
      "h1, h2, h3, h4, h5, h6": {"color": "#6e4b3a"},
      "a": {"color": "#8b4513"},
      "img": {
        "-webkit-filter": "sepia(1) contrast(1.5)",
        "filter": "sepia(1) contrast(1.5)"
      },
      "code": {"color": "#8b0000", "background-color": "#f4ecd8"}
    }
    ],
    [
      'white', {
      "body": {"background-color": "white", "color": "black", "font-family": "Arial, sans-serif"},
      "p": {"color": "black"},
      "h1, h2, h3, h4, h5, h6": {"color": "black"},
      "a": {"color": "#1e90ff"},
      "img": {
        "-webkit-filter": "none",
        "filter": "none"
      },
      "code": {"color": "#d14", "background-color": "#f5f5f5"}
    }
    ],
    [
      'grey', {
      "body": {"background-color": "#404040", "color": "#d3d3d3", "font-family": "Arial, sans-serif"},
      "p": {"color": "#d3d3d3"},
      "h1, h2, h3, h4, h5, h6": {"color": "#d3d3d3"},
      "a": {"color": "#1e90ff"},
      "img": {
        "filter": "none"
      },
      "code": {"color": "#d14", "background-color": "#585858"}
    }
    ]
  ]);
}

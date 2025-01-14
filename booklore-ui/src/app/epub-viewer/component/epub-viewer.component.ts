import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import ePub from 'epubjs';
import {EpubService} from '../service/epub.service';
import {Drawer} from 'primeng/drawer';
import {Button} from 'primeng/button';
import {NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Divider} from 'primeng/divider';
import {DropdownModule} from 'primeng/dropdown';
import {ActivatedRoute} from '@angular/router';
import {Book} from '../../book/model/book.model';
import {BookService} from '../../book/service/book.service';

@Component({
  selector: 'app-epub-viewer',
  templateUrl: './epub-viewer.component.html',
  styleUrls: ['./epub-viewer.component.scss'],
  imports: [Drawer, Button, NgForOf, FormsModule, Divider, DropdownModule]
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
  bookLoreBook: Book | undefined

  fontTypes: any[] = [
    {label: 'Serif', value: 'serif'},
    {label: 'Sans Serif', value: 'sans-serif'},
    {label: 'Roboto', value: 'roboto'},
    {label: 'Cursive', value: 'cursive'},
    {label: 'Monospace', value: 'monospace'}
  ];
  selectedFontType: string = 'serif';

  constructor(private epubService: EpubService, private route: ActivatedRoute, private bookService: BookService) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.loadBook(+params.get('bookId')!)
      this.loadEpub(+params.get('bookId')!);
    });
  }

  private loadBook(bookId: number): void {
    this.bookService.getBookById(bookId).subscribe((book) => {
      this.bookLoreBook = book;
    });
  }

  loadEpub(bookId: number): void {
    this.epubService.downloadEpub(bookId).subscribe(
      (data: Blob) => {
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

          if(this.bookLoreBook?.epubProgress) {
            this.rendition.display(this.bookLoreBook?.epubProgress);
          } else {
            this.rendition.display();
          }

          this.setupKeyListener();
          this.updateFontSize();
          this.trackProgress();
        };
        fileReader.readAsArrayBuffer(data);
      },
      (error) => {
        console.error('Failed to load the EPUB:', error);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.rendition) {
      this.rendition.off('keyup', this.keyListener);
    }
    document.removeEventListener('keyup', this.keyListener);
  }

  private trackProgress(): void {
    if (this.rendition) {
      this.rendition.on('relocated', (location: any) => {
        const percentage = location.start.percentage.toFixed(2);
        console.log(`Reading progress: ${percentage * 100}%`);
        console.log('Current location:', location);
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
    if (this.fontSize > 200) {
      this.fontSize = 200;
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

  changeFontType(event: any): void {
    if (this.rendition) {
      this.rendition.themes.font(this.selectedFontType);
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
}

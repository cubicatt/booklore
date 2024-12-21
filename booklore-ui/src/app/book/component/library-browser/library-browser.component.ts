import {Component, computed, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {LibraryAndBookService} from '../../service/library-and-book.service';
import {Button} from 'primeng/button';
import {NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DropdownModule} from 'primeng/dropdown';
import {LazyLoadImageModule} from 'ng-lazyload-image';
import {VirtualScrollerModule} from '@iharbeck/ngx-virtual-scroller';
import {SpeedDialModule} from 'primeng/speeddial';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {BookCardComponent} from '../../../book-card/book-card.component';

@Component({
  selector: 'app-library-browser-v2',
  templateUrl: './library-browser.component.html',
  styleUrls: ['./library-browser.component.scss'],
  imports: [
    Button,
    NgForOf,
    FormsModule,
    DropdownModule,
    LazyLoadImageModule,
    VirtualScrollerModule,
    SpeedDialModule,
    ConfirmDialogModule,
    BookCardComponent
  ]
})
export class LibraryBrowserComponent implements OnInit {
  private currentLibraryId = signal<number | null>(null);

  protected currentLibraryBooks = computed(() =>
    this.currentLibraryId() != null ? this.libraryBookService.getLibraryBooks(this.currentLibraryId()!)() : []);

  protected currentLibraryName = computed(() =>
    this.libraryBookService.libraries().find(library => library.id === this.currentLibraryId())?.name || 'Library not found');

  items: MenuItem[] | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router, private libraryBookService: LibraryAndBookService,
    private confirmationService: ConfirmationService, private messageService: MessageService) {
  }

  ngOnInit(): void {
    this.items = [
      {
        icon: 'pi pi-pencil',
        tooltipOptions: {
          tooltipLabel: 'Rename',
          tooltipPosition: "top"
        },
        command: () => {
          this.confirmationService.confirm({
            message: 'Sure you want to delete: ' + this.currentLibraryName() + "?",
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon:"none",
            rejectIcon:"none",
            rejectButtonStyleClass:"p-button-text",
            accept: () => {
              this.libraryBookService.deleteLibrary(this.currentLibraryId()).subscribe({
                complete: () => {
                  this.router.navigate(['/']);
                  this.messageService.add({ severity: 'info', summary: 'Success', detail: 'Library was deleted' });
                },
                error: () => {
                  this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Failed to delete library', life: 3000 });
                }
              });
            }
          });
        }
      },
      {
        icon: 'pi pi-trash',
        tooltipOptions: {
          tooltipLabel: 'Delete',
          tooltipPosition: "top"
        },
        command: () => {
          this.confirmationService.confirm({
            message: 'Sure you want to delete: ' + this.currentLibraryName() + "?",
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon:"none",
            rejectIcon:"none",
            rejectButtonStyleClass:"p-button-text",
            accept: () => {
              this.libraryBookService.deleteLibrary(this.currentLibraryId()).subscribe({
                  complete: () => {
                    this.router.navigate(['/']);
                    this.messageService.add({ severity: 'info', summary: 'Success', detail: 'Library was deleted' });
                  },
                  error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Failed to delete library', life: 3000 });
                  }
                });
            }
          });
        }
      }
    ];

    this.activatedRoute.paramMap.subscribe((params) => {
      const libraryId = Number(params.get('libraryId'));
      if (libraryId) {
        this.currentLibraryId.set(libraryId);
        this.libraryBookService.loadBooksSignal(libraryId);
      }
    });
  }

}

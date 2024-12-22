import {Component, OnInit, computed, signal, Signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {LibraryAndBookService} from '../../service/library-and-book.service';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
import {Book} from "../../model/book.model";

@Component({
    selector: 'app-books-browser',
    standalone: false,
    templateUrl: './books-browser.component.html',
    styleUrls: ['./books-browser.component.scss']
})
export class BooksBrowserComponent implements OnInit {
    private currentEntityId = signal<number | null>(null);
    private entityType = signal<'library' | 'shelf'>('library');

    books!: Signal<Book[]>;
    title = computed(() => {
        const entityId = this.currentEntityId();
        const type = this.entityType();
        if (type === 'library') {
            const library = this.libraryBookService.getLibraries()().find(library => library.id === entityId);
            return library ? `Library: ${library.name}` : 'Library not found';
        }

        if (type === 'shelf') {
            const shelf = this.libraryBookService.getShelves()().find(shelf => shelf.id === entityId);
            return shelf ? `Shelf: ${shelf.name}` : 'Shelf not found';
        }
        return '';
    });

    items: MenuItem[] | undefined;


    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private libraryBookService: LibraryAndBookService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) {
    }

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe((params) => {
            const libraryId = Number(params.get('libraryId'));
            const shelfId = Number(params.get('shelfId'));
            if (libraryId) {
                this.entityType.set('library');
                this.currentEntityId.set(libraryId);
                this.books = this.libraryBookService.getLibraryBooks(libraryId);
                this.libraryBookService.getLibraries();
            } else if (shelfId) {
                this.entityType.set('shelf');
                this.currentEntityId.set(shelfId);
                this.books = this.libraryBookService.getShelfBooks(shelfId);
                this.libraryBookService.getShelves();
            }
        });

        if (this.entityType() === 'library') {
            this.initializeLibraryMenuItems();
        } else if (this.entityType() === 'shelf') {
            this.initializeShelfMenuItems();
        }
    }

    private initializeLibraryMenuItems(): void {
        this.items = [
            {
                icon: 'pi pi-trash',
                tooltipOptions: {
                    tooltipLabel: 'Delete',
                    tooltipPosition: 'top'
                },
                command: () => {
                    this.confirmationService.confirm({
                        message: 'Sure you want to delete ' + this.title() + "?",
                        header: 'Confirmation',
                        icon: 'pi pi-exclamation-triangle',
                        acceptIcon: 'none',
                        rejectIcon: 'none',
                        rejectButtonStyleClass: 'p-button-text',
                        accept: () => {
                            this.libraryBookService.deleteLibrary(this.currentEntityId()).subscribe({
                                complete: () => {
                                    this.router.navigate(['/']);
                                    this.messageService.add({
                                        severity: 'info',
                                        summary: 'Success',
                                        detail: 'Library was deleted'
                                    });
                                },
                                error: () => {
                                    this.messageService.add({
                                        severity: 'error',
                                        summary: 'Failed',
                                        detail: 'Failed to delete library',
                                        life: 3000
                                    });
                                }
                            });
                        }
                    });
                }
            }
        ];
    }

    private initializeShelfMenuItems(): void {
        this.items = [
            {
                icon: 'pi pi-trash',
                tooltipOptions: {
                    tooltipLabel: 'Delete',
                    tooltipPosition: 'top'
                },
                command: () => {
                    this.confirmationService.confirm({
                        message: 'Sure you want to delete ' + this.title() + "?",
                        header: 'Confirmation',
                        icon: 'pi pi-exclamation-triangle',
                        acceptIcon: 'none',
                        rejectIcon: 'none',
                        rejectButtonStyleClass: 'p-button-text',
                        accept: () => {
                            this.libraryBookService.deleteShelf(this.currentEntityId()!).subscribe({
                                complete: () => {
                                    this.router.navigate(['/']);
                                    this.messageService.add({
                                        severity: 'info',
                                        summary: 'Success',
                                        detail: 'Shelf was deleted'
                                    });
                                },
                                error: () => {
                                    this.messageService.add({
                                        severity: 'error',
                                        summary: 'Failed',
                                        detail: 'Failed to delete shelf',
                                        life: 3000
                                    });
                                }
                            });
                        }
                    });
                }
            }
        ];
    }
}

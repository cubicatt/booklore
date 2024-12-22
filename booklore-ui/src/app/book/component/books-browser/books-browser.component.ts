import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LibraryAndBookService } from '../../service/library-and-book.service';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';

@Component({
    selector: 'app-books-browser',
    standalone: false,
    templateUrl: './books-browser.component.html',
    styleUrls: ['./books-browser.component.scss']
})
export class BooksBrowserComponent implements OnInit {

    private currentEntityId = signal<number | null>(null);
    private entityType = signal<'library' | 'shelf'>('library'); // Default to library

    items: MenuItem[] | undefined;

    protected currentEntityBooks = computed(() => {
        if (this.currentEntityId() != null) {
            return this.entityType() === 'library'
                ? this.libraryBookService.getLibraryBooks(this.currentEntityId()!)()
                : this.libraryBookService.getShelfBooks(this.currentEntityId()!)();
        }
        return [];
    });

    protected currentEntityName = computed(() => {
        if (this.entityType() === 'library') {
            return 'Library: ' + (this.libraryBookService.libraries().find(library => library.id === this.currentEntityId())?.name || 'Library not found');
        }
        return 'Shelf: ' + (this.libraryBookService.shelves().find(shelf => shelf.id === this.currentEntityId())?.name || 'Shelf not found');
    });

    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private libraryBookService: LibraryAndBookService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe((params) => {
            const libraryId = Number(params.get('libraryId'));
            const shelfId = Number(params.get('shelfId'));

            if (libraryId) {
                this.entityType.set('library');
                this.currentEntityId.set(libraryId);
                this.libraryBookService.loadBooksSignal(libraryId);
            } else if (shelfId) {
                this.entityType.set('shelf');
                this.currentEntityId.set(shelfId);
                this.libraryBookService.loadBooksSignal(shelfId);
            }
        });

        if (this.entityType() === 'library') {
            this.initializeLibraryMenuItems();
        } else if (this.entityType() === 'shelf') {
            //this.initializeShelfMenuItems();
        }
    }

    private initializeLibraryMenuItems(): void {
        this.items = [
            {
                icon: 'pi pi-pencil',
                tooltipOptions: {
                    tooltipLabel: 'Rename',
                    tooltipPosition: 'top'
                },
                command: () => {
                    this.confirmationService.confirm({
                        message: 'Sure you want to delete: ' + this.currentEntityName() + "?",
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
            },
            {
                icon: 'pi pi-trash',
                tooltipOptions: {
                    tooltipLabel: 'Delete',
                    tooltipPosition: 'top'
                },
                command: () => {
                    this.confirmationService.confirm({
                        message: 'Sure you want to delete: ' + this.currentEntityName() + "?",
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

    /*private initializeShelfMenuItems(): void {
        this.items = [
            {
                icon: 'pi pi-pencil',
                tooltipOptions: {
                    tooltipLabel: 'Rename',
                    tooltipPosition: 'top'
                },
                command: () => {
                    this.confirmationService.confirm({
                        message: 'Sure you want to delete: ' + this.currentEntityName() + "?",
                        header: 'Confirmation',
                        icon: 'pi pi-exclamation-triangle',
                        acceptIcon: 'none',
                        rejectIcon: 'none',
                        rejectButtonStyleClass: 'p-button-text',
                        accept: () => {
                            this.libraryBookService.deleteShelf(this.currentEntityId()).subscribe({
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
            },
            {
                icon: 'pi pi-trash',
                tooltipOptions: {
                    tooltipLabel: 'Delete',
                    tooltipPosition: 'top'
                },
                command: () => {
                    this.confirmationService.confirm({
                        message: 'Sure you want to delete: ' + this.currentEntityName() + "?",
                        header: 'Confirmation',
                        icon: 'pi pi-exclamation-triangle',
                        acceptIcon: 'none',
                        rejectIcon: 'none',
                        rejectButtonStyleClass: 'p-button-text',
                        accept: () => {
                            this.libraryBookService.deleteShelf(this.currentEntityId()).subscribe({
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
    }*/
}

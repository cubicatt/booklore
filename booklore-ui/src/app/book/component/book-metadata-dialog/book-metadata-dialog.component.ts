import {Component, OnInit} from '@angular/core';
import {BookMetadata} from '../../model/book.model';
import {NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Router} from '@angular/router';
import {Button} from 'primeng/button';
import {BookService} from '../../service/book.service';

@Component({
  selector: 'app-books-metadata-dialog',
  templateUrl: './books-metadata-dialog.component.html',
  imports: [
    NgIf,
    NgForOf,
    FormsModule,
    Button
  ],
  styleUrls: ['./books-metadata-dialog.component.scss']
})
export class BookMetadataDialogComponent implements OnInit {
  bookMetadataList: BookMetadata[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  searchText: string = '';
  isButtonDisabled = false;
  bookId: number = 0;
  libraryId: number = 0;

  constructor(private bookService: BookService, public dynamicDialogConfig: DynamicDialogConfig, private dynamicDialogRef: DynamicDialogRef, private router: Router) {
    this.searchText = dynamicDialogConfig.data.bookTitle;
    this.bookId = this.dynamicDialogConfig.data.bookId;
    this.libraryId = this.dynamicDialogConfig.data.libraryId;
  }

  ngOnInit(): void {
    this.bookService.fetchBookMetadataByBookId(this.bookId).subscribe({
      next: (metadataList) => {
        this.bookMetadataList = metadataList;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load metadata';
        this.isLoading = false;
      }
    });
  }

  selectMetadata(metadata: BookMetadata): void {
    this.bookService.setBookMetadata(metadata.googleBookId, this.bookId).subscribe({
      next: () => {
        this.dynamicDialogRef.close();
        this.router.navigate(['/library', this.libraryId, 'book', this.bookId, 'info']);
      },
      error: (error) => {
        this.errorMessage = 'Failed to save book metadata';
      }
    });

  }

  truncateDescription(description: string): string {
    const maxLength = 1500;
    return description && description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
  }

  populateTitle() {
    this.isButtonDisabled = true;

    setTimeout(() => {
      if (this.isButtonDisabled) {
        this.isButtonDisabled = false;
        this.errorMessage = 'Request timed out. Please try again.';
      }
    }, 5000);

    this.bookService.fetchBookMetadataByTerm(this.searchText).subscribe({
      next: (metadataList) => {
        this.bookMetadataList = metadataList;
        this.isLoading = false;
        this.isButtonDisabled = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load metadata';
        this.isLoading = false;
        this.isButtonDisabled = false;
      }
    });
  }
}


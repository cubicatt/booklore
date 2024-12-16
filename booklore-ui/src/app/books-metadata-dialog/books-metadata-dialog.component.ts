import {Component, OnInit} from '@angular/core';
import {BookMetadata} from '../book/model/book.model';
import {BookService} from '../book/service/book.service';
import {NgForOf, NgIf} from '@angular/common';
import {FormBuilder, FormsModule} from '@angular/forms';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Router} from '@angular/router';
import {Button} from 'primeng/button';

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
export class BooksMetadataDialogComponent implements OnInit {
  bookMetadataList: BookMetadata[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  searchText: string = '';
  bookId: number = 0;

  constructor(private bookService: BookService, public dynamicDialogConfig: DynamicDialogConfig,
              private dynamicDialogRef: DynamicDialogRef, private router: Router) {
    this.searchText = dynamicDialogConfig.data.bookTitle;
    this.bookId = this.dynamicDialogConfig.data.bookId;
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
        this.router.navigate(['/book', this.bookId, 'info']);
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
    this.bookService.fetchBookMetadataByTerm(this.searchText).subscribe({
      next: (metadataList) => {
        this.bookMetadataList = metadataList;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load metadata';
        this.isLoading = false;
      }
    })
  }
}

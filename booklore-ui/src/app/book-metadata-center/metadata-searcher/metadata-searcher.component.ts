import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {Divider} from 'primeng/divider';
import {NgForOf, NgIf} from '@angular/common';
import {Provider} from '../../book/model/provider.model';
import {BookService} from '../../book/service/book.service';
import {FetchMetadataRequest} from '../../book/model/fetch-metadata-request.model';
import {FetchedMetadata} from '../../book/model/book.model';
import {ProgressSpinner} from 'primeng/progressspinner';
import {MetadataPickerComponent} from '../metadata-picker/metadata-picker.component';
import {BookMetadataCenterService} from '../book-metadata-center.service';

@Component({
  selector: 'app-metadata-searcher',
  templateUrl: './metadata-searcher.component.html',
  styleUrls: ['./metadata-searcher.component.scss'],
  imports: [
    Select,
    ReactiveFormsModule,
    Button,
    InputText,
    Divider,
    NgForOf,
    NgIf,
    ProgressSpinner,
    MetadataPickerComponent
  ],
  standalone: true
})
export class MetadataSearcherComponent implements OnInit {

  form: FormGroup;
  providers = Object.values(Provider);
  allFetchedMetadata: FetchedMetadata[] = [];
  selectedFetchedMetadata!: FetchedMetadata | null;
  bookId!: number;
  loading: boolean = false;

  constructor(private fb: FormBuilder, private bookService: BookService, private bookInfoService: BookMetadataCenterService) {
    this.form = this.fb.group({
      provider: null,
      isbn: [''],
      title: [''],
      author: [''],
    });
  }

  ngOnInit() {
    this.bookInfoService.bookMetadata$.subscribe((bookMetadata => {
      if (bookMetadata) {
        this.bookId = bookMetadata.bookId;
        this.form.setValue(({
          provider: null,
          isbn: bookMetadata.isbn10,
          title: bookMetadata.title,
          author: bookMetadata.authors.length > 0 ? bookMetadata.authors[0] : ''
        }))
      }
    }))
  }

  get isSearchEnabled(): boolean {
    const providerSelected = !!this.form.get('provider')?.value;
    const isbnOrTitle = this.form.get('isbn')?.value || this.form.get('title')?.value;
    return providerSelected && isbnOrTitle;
  }

  onSubmit(): void {
    if (this.form.valid) {
      const providerKey = Object.keys(Provider).find(
        key => Provider[key as keyof typeof Provider] === this.form.get('provider')?.value
      );
      if (!providerKey) {
        console.error('Invalid provider selected.');
        return;
      }
      const fetchRequest: FetchMetadataRequest = {
        bookId: this.bookId,
        provider: providerKey,
        title: this.form.get('title')?.value,
        isbn: this.form.get('isbn')?.value,
        author: this.form.get('author')?.value
      };
      this.loading = true;
      this.bookService.fetchMetadata(fetchRequest.bookId, fetchRequest)
        .subscribe({
          next: (fetchedMetadata) => {
            this.loading = false;
            this.allFetchedMetadata = fetchedMetadata.map((book) => ({
              ...book,
              thumbnailUrl: book.thumbnailUrl
            }));
          },
          error: (err) => {
            this.loading = false;
          }
        });
    } else {
      console.warn('Form is invalid. Please fill in all required fields.');
    }
  }

  truncateText(text: string | null, length: number): string {
    const safeText = text ?? '';
    return safeText.length > length ? safeText.substring(0, length) + '...' : safeText;
  }

  onBookClick(fetchedMetadata: FetchedMetadata) {
    this.selectedFetchedMetadata = fetchedMetadata;
  }

  onGoBack($event: boolean) {
    this.selectedFetchedMetadata = null;
  }
}

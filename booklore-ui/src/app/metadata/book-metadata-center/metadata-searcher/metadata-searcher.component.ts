import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {Divider} from 'primeng/divider';
import {NgForOf, NgIf} from '@angular/common';
import {MetadataProvider} from '../../model/provider.model';
import {FetchMetadataRequest} from '../../model/request/fetch-metadata-request.model';
import {ProgressSpinner} from 'primeng/progressspinner';
import {MetadataPickerComponent} from '../metadata-picker/metadata-picker.component';
import {BookMetadataCenterService} from '../book-metadata-center.service';
import {MultiSelect} from 'primeng/multiselect';
import {MetadataService} from '../../service/metadata.service';
import {BookMetadata} from '../../../book/model/book.model';

@Component({
  selector: 'app-metadata-searcher',
  templateUrl: './metadata-searcher.component.html',
  styleUrls: ['./metadata-searcher.component.scss'],
  imports: [ReactiveFormsModule, Button, InputText, Divider, NgForOf, NgIf, ProgressSpinner, MetadataPickerComponent, MultiSelect],
  standalone: true
})
export class MetadataSearcherComponent implements OnInit {

  form: FormGroup;
  providers = Object.values(MetadataProvider);
  allFetchedMetadata: BookMetadata[] = [];
  selectedFetchedMetadata!: BookMetadata | null;
  bookId!: number;
  loading: boolean = false;

  private formBuilder = inject(FormBuilder);
  private metadataCenterService = inject(BookMetadataCenterService);
  private metadataService = inject(MetadataService);

  constructor() {
    this.form = this.formBuilder.group({
      provider: null,
      isbn: [''],
      title: [''],
      author: [''],
    });
  }

  ngOnInit() {
    this.metadataCenterService.currentMetadata$.subscribe((metadata => {
      if (metadata) {
        this.bookId = metadata.bookId;
        this.form.setValue(({
          provider: Object.values(MetadataProvider),
          isbn: metadata.isbn10,
          title: metadata.title,
          author: metadata.authors?.length! > 0 ? metadata.authors[0] : ''
        }));
      }
    }));
    //this.onSubmit();
  }

  get isSearchEnabled(): boolean {
    const providerSelected = !!this.form.get('provider')?.value;
    const isbnOrTitle = this.form.get('isbn')?.value || this.form.get('title')?.value;
    return providerSelected && isbnOrTitle;
  }

  onSubmit(): void {
    if (this.form.valid) {
      const providerKeys = Object.keys(MetadataProvider).filter(key =>
        (this.form.get('provider')?.value as string[]).includes(MetadataProvider[key as keyof typeof MetadataProvider])
      );
      if (!providerKeys) {
        console.error('Invalid provider selected.');
        return;
      }
      const fetchRequest: FetchMetadataRequest = {
        bookId: this.bookId,
        providers: providerKeys,
        title: this.form.get('title')?.value,
        isbn: this.form.get('isbn')?.value,
        author: this.form.get('author')?.value
      };
      this.loading = true;
      this.metadataService.fetchBookMetadata(fetchRequest.bookId, fetchRequest)
        .subscribe({
          next: (fetchedMetadata) => {
            this.loading = false;
            this.allFetchedMetadata = fetchedMetadata.map((fetchedMetadata) => ({
              ...fetchedMetadata,
              thumbnailUrl: fetchedMetadata.thumbnailUrl
            }));
          },
          error: () => {
            this.loading = false;
          }
        });
    } else {
      console.warn('Form is invalid. Please fill in all required fields.');
    }
  }

  buildProviderLink(metadata: BookMetadata): string {
    if (!metadata.provider || !metadata.providerBookId) {
      throw new Error("Invalid metadata: 'provider' or 'providerBookId' is missing.");
    }
    switch (metadata.provider) {
      case "Amazon":
        return `<a href="https://www.amazon.com/dp/${metadata.providerBookId}" target="_blank">Amazon</a>`;
      case "GoodReads":
        return `<a href="https://www.goodreads.com/book/show/${metadata.providerBookId}" target="_blank">Goodreads</a>`;
      case "Google":
        return `<a href="https://books.google.com/books?id=${metadata.providerBookId}" target="_blank">Google</a>`;
      default:
        throw new Error(`Unsupported provider: ${metadata.provider}`);
    }
  }

  truncateText(text: string | null, length: number): string {
    const safeText = text ?? '';
    return safeText.length > length ? safeText.substring(0, length) + '...' : safeText;
  }

  onBookClick(fetchedMetadata: BookMetadata) {
    this.selectedFetchedMetadata = fetchedMetadata;
  }

  onGoBack() {
    this.selectedFetchedMetadata = null;
  }

  sanitizeHtml(htmlString: string | null | undefined): string {
    if (!htmlString) {
      return '';
    }
    return htmlString.replace(/<\/?[^>]+(>|$)/g, '').trim();
  }
}

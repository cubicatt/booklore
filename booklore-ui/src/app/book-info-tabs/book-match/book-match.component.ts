import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {BookMetadataForm} from '../../book/model/book-metadata-form';
import {Divider} from 'primeng/divider';
import {NgForOf, NgIf} from '@angular/common';
import {Provider} from '../../book/model/provider.model';
import {BookService} from '../../book/service/book.service';
import {FetchMetadataRequest} from '../../book/model/fetch-metadata-request.model';
import {FetchedMetadata} from '../../book/model/book.model';
import {DomSanitizer} from '@angular/platform-browser';
import {ProgressSpinner} from 'primeng/progressspinner';

@Component({
  selector: 'app-book-match',
  templateUrl: './book-match.component.html',
  styleUrls: ['./book-match.component.scss'],
  imports: [
    Select,
    ReactiveFormsModule,
    Button,
    InputText,
    Divider,
    NgForOf,
    NgIf,
    ProgressSpinner
  ],
  standalone: true
})
export class BookMatchComponent implements OnChanges {

  @Input() metadata!: BookMetadataForm;
  form: FormGroup;
  providers = Object.values(Provider);
  books: FetchedMetadata[] = [];
  loading: boolean = false;

  constructor(private fb: FormBuilder, private bookService: BookService, private sanitizer: DomSanitizer) {
    this.form = this.fb.group({
      provider: [null],
      isbn: [''],
      title: [''],
      author: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['metadata'] && this.metadata) {
      const firstAuthor = this.metadata.authors && this.metadata.authors.length > 0 ? this.metadata.authors[0] : '';
      this.form.patchValue({
        isbn: this.metadata.isbn10 || '',
        title: this.metadata.title || '',
        author: firstAuthor,
      });
    }
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
        bookId: 1,
        provider: providerKey,
        title: this.form.get('title')?.value,
        isbn: this.form.get('isbn')?.value,
        author: this.form.get('author')?.value
      };

      this.loading = true;
      this.bookService.fetchMetadataFromSource(fetchRequest.bookId, fetchRequest)
        .subscribe({
          next: (fetchedMetadata) => {
            console.log('Metadata fetched successfully', fetchedMetadata);
            this.loading = false;
            this.books = fetchedMetadata.map((book) => ({
              ...book,
              thumbnailUrl: book.thumbnailUrl
            }));
          },
          error: (err) => {
            this.loading = false;
            console.error('Error fetching metadata', err);
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

}

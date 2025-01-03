import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {Divider} from 'primeng/divider';
import {NgForOf, NgIf} from '@angular/common';
import {Provider} from '../../book/model/provider.model';
import {BookService} from '../../book/service/book.service';
import {FetchMetadataRequest} from '../../book/model/fetch-metadata-request.model';
import {Book, FetchedMetadata} from '../../book/model/book.model';
import {ProgressSpinner} from 'primeng/progressspinner';
import {MetadataSearcherComponent} from '../metadata-searcher/metadata-searcher.component';

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
    ProgressSpinner,
    MetadataSearcherComponent
  ],
  standalone: true
})
export class BookMatchComponent implements OnInit {

  @Input() book!: Book;

  form: FormGroup;
  providers = Object.values(Provider);
  fetchedMetadata: FetchedMetadata[] = [];
  selectedMetadata!: FetchedMetadata;
  loading: boolean = false;

  constructor(private fb: FormBuilder, private bookService: BookService) {
    this.form = this.fb.group({
      provider: [null],
      isbn: [''],
      title: [''],
      author: [''],
    });
  }

  ngOnInit() {
      const firstAuthor = this.book!.metadata?.authors && this.book!.metadata?.authors.length > 0 ? this.book!.metadata?.authors[0].name : '';
      this.form.patchValue({
        isbn: this.book!.metadata?.isbn10 || '',
        title: this.book!.metadata?.title || '',
        author: firstAuthor,
      });
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
            this.fetchedMetadata = fetchedMetadata.map((book) => ({
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

  onBookClick(book: FetchedMetadata) {
    this.selectedMetadata = book;
  }
}

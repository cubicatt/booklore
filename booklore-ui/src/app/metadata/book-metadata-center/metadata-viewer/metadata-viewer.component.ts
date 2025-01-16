import {Component, inject} from '@angular/core';
import {Button} from 'primeng/button';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {Observable} from 'rxjs';
import {BookService} from '../../../book/service/book.service';
import {BookMetadataCenterService} from '../book-metadata-center.service';
import {Rating} from 'primeng/rating';
import {FormsModule} from '@angular/forms';
import {Tag} from 'primeng/tag';
import {Editor} from 'primeng/editor';
import {Author, Book} from '../../../book/model/book.model';
import {FileService} from '../../../book/service/file.service';

@Component({
  selector: 'app-metadata-viewer',
  standalone: true,
  templateUrl: './metadata-viewer.component.html',
  styleUrl: './metadata-viewer.component.scss',
  imports: [Button, NgForOf, NgIf, AsyncPipe, Rating, FormsModule, Tag, Editor]
})
export class MetadataViewerComponent {

  private bookService = inject(BookService);
  private fileService = inject(FileService);
  private metadataCenterService = inject(BookMetadataCenterService);

  metadata$: Observable<Book['metadata'] | null> = this.metadataCenterService.bookMetadata$;

  coverImageSrc(bookId: number | undefined): string {
    return bookId ? this.bookService.getBookCoverUrl(bookId) : 'assets/book-cover-metadata.png';
  }

  readBook(bookId: number): void {
    this.bookService.readBook(bookId);
  }

  closeDialog(): void {
    this.metadataCenterService.closeDialog(true);
  }

  getAuthorNames(authors: Author[]): string {
    return authors.map(author => author.name).join(', ');
  }

  download(bookId: number) {
    this.fileService.downloadFile(bookId);
  }
}

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Image } from 'primeng/image';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { FormsModule } from '@angular/forms';
import { BookMetadataForm } from '../../book/model/book-metadata-form';

@Component({
  selector: 'app-book-details',
  standalone: true,
  templateUrl: './book-details.component.html',
  imports: [
    InputText,
    Textarea,
    Image,
    Button,
    Divider,
    FormsModule
  ],
  styleUrl: './book-details.component.scss'
})
export class BookDetailsComponent implements OnChanges {

  @Input() bookForm!: BookMetadataForm;
  @Output() save = new EventEmitter<BookMetadataForm>();

  authorsInput: string = '';
  categoriesInput: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (this.bookForm.authors) {
      this.authorsInput = this.bookForm.authors.join(', ');
    }
    if (this.bookForm.categories) {
      this.categoriesInput = this.bookForm.categories.join(', ');
    }
  }

  onSave(): void {
    if (this.authorsInput) {
      this.bookForm.authors = this.authorsInput.split(',').map(author => author.trim());
    }
    if (this.categoriesInput) {
      this.bookForm.categories = this.categoriesInput.split(',').map(category => category.trim());
    }
    this.save.emit(this.bookForm);
  }

  onAuthorsInputChange(): void {
    if (this.authorsInput) {
      this.bookForm.authors = this.authorsInput.split(',').map(author => author.trim());
    }
  }

  onCategoriesInputChange(): void {
    if (this.categoriesInput) {
      this.bookForm.categories = this.categoriesInput.split(',').map(category => category.trim());
    }
  }
}

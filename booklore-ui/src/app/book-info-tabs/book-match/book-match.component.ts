import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {BookMetadataForm} from '../../book/model/book-metadata-form';
import {Image} from 'primeng/image';
import {Divider} from 'primeng/divider';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-book-match',
  templateUrl: './book-match.component.html',
  styleUrls: ['./book-match.component.scss'],
  imports: [
    Select,
    ReactiveFormsModule,
    Button,
    InputText,
    Image,
    Divider,
    NgForOf
  ],
  standalone: true
})
export class BookMatchComponent implements OnChanges {
  form: FormGroup;
  providers: string[] = ['Amazon', 'Google Books', 'Google Books (API)'];
  @Input() metadata!: BookMetadataForm;

  books = [
    {
      title: 'Code That Fits in Your Head',
      isbn: '1234567890',
      year: 2000,
      author: 'Mark Seemann',
      description: `How to Reduce Code Complexity and Develop Software More Sustainably.
        "Mark Seemann is well known for explaining complex concepts clearly and thoroughly. In this book he condenses his wide-ranging software development experience into a set of practical, pragmatic techniques for writing sustainable and human-friendly code. This book will be a must-read for every programmer who wants to write better, more maintainable software. It covers a variety of topics from managing complexity to understanding software architecture, and helps developers see how their decisions can influence the success or failure of their projects.`,
      imageUrl: 'https://m.media-amazon.com/images/I/61GzazUmKyL._SL1462_.jpg'
    },
    {
      title: 'The Pragmatic Programmer',
      isbn: '9876543210',
      year: 1999,
      author: 'Andrew Hunt',
      description: `A book that helps developers keep track of software practices and strategies that ensure long-term success. It emphasizes adaptability, flexibility, and sustainable development practices. Written by Andrew Hunt and David Thomas, this timeless classic has been guiding developers on their journey to mastering their craft for over 20 years.`,
      imageUrl: 'https://m.media-amazon.com/images/I/81OthjkJBuL._AC_UL320_.jpg'
    },
    {
      title: 'Clean Code',
      isbn: '1122334455',
      year: 2008,
      author: 'Robert C. Martin',
      description: `This book provides guidelines for writing clean, maintainable code. It is divided into several sections that cover topics like meaningful naming conventions, functions, comments, and the importance of writing code that others can easily understand and work with.`,
      imageUrl: 'https://m.media-amazon.com/images/I/81-xuU4chcL._AC_UL320_.jpg'
    },
    {
      title: 'Domain-Driven Design',
      isbn: '2233445566',
      year: 2003,
      author: 'Eric Evans',
      description: `In this book, Eric Evans presents a methodology for designing complex software systems called Domain-Driven Design (DDD). This approach is based on collaboration between technical experts and domain experts, working together to create a shared understanding of the problem domain and translating that into software models.`,
      imageUrl: 'https://m.media-amazon.com/images/I/71dx2jr5cML._AC_UL320_.jpg'
    },
    {
      title: 'Refactoring: Improving the Design of Existing Code',
      isbn: '3344556677',
      year: 1999,
      author: 'Martin Fowler',
      description: `Refactoring provides techniques for improving the design of existing code without changing its functionality. In this book, Martin Fowler offers a practical approach to restructuring software to improve its internal structure, making it easier to understand and maintain.`,
      imageUrl: 'https://m.media-amazon.com/images/I/81yLrM7b4uL._AC_UL320_.jpg'
    },
    {
      title: 'The Clean Coder',
      isbn: '4455667788',
      year: 2011,
      author: 'Robert C. Martin',
      description: `The Clean Coder focuses on what it means to be a professional software developer. Robert C. Martin (Uncle Bob) presents a series of principles and techniques that every developer should adopt to approach their work with professionalism and integrity.`,
      imageUrl: 'https://m.media-amazon.com/images/I/81-s6sxtdGL._AC_UL320_.jpg'
    },
    {
      title: 'Working Effectively with Legacy Code',
      isbn: '5566778899',
      year: 2004,
      author: 'Michael Feathers',
      description: `Working with legacy code can be one of the most challenging aspects of software development. Michael Feathers provides practical strategies for dealing with and improving legacy codebases that were not designed with the same care or architecture as modern software.`,
      imageUrl: 'https://m.media-amazon.com/images/I/91D4vYbkvwL._AC_UL320_.jpg'
    }
  ];

  constructor(private fb: FormBuilder) {
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
      console.log('Form submitted', this.form.value);
    }
  }
}

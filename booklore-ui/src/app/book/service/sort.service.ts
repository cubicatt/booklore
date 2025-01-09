import {Injectable} from '@angular/core';
import {Book} from '../model/book.model';
import {SortDirection, SortOption} from "../model/sort.model";

@Injectable({
  providedIn: 'root',
})
export class SortService {

  private readonly fieldExtractors: Record<string, (book: Book) => any> = {
    title: (book) => book.metadata?.title?.toLowerCase() || null,
    publishedDate: (book) =>book.metadata?.publishedDate === null ? null : new Date(book.metadata?.publishedDate!).getTime(),
    publisher: (book) => book.metadata?.publisher || null,
    pageCount: (book) => book.metadata?.pageCount || null,
    rating: (book) => book.metadata?.rating || null,
    reviewCount: (book) => book.metadata?.reviewCount || null,
  };

  applySort(books: Book[], selectedSort: SortOption | null): Book[] {
    if (!selectedSort) return books;

    const {field, direction} = selectedSort;
    const extractor = this.fieldExtractors[field];

    if (!extractor) return books;

    return books.sort((a, b) => {
      const valueA = extractor(a);
      const valueB = extractor(b);

      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;

      if (direction === SortDirection.ASCENDING) {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
  }

  static generateSortOptions(): SortOption[] {
    return [
      {label: '↑ Title', field: 'title', direction: SortDirection.ASCENDING},
      {label: '↓ Title', field: 'title', direction: SortDirection.DESCENDING},
      {label: '↑ Published', field: 'publishedDate', direction: SortDirection.ASCENDING},
      {label: '↓ Published', field: 'publishedDate', direction: SortDirection.DESCENDING},
      {label: '↑ Pages', field: 'pageCount', direction: SortDirection.ASCENDING},
      {label: '↓ Pages', field: 'pageCount', direction: SortDirection.DESCENDING},
      {label: '↑ Rating', field: 'rating', direction: SortDirection.ASCENDING},
      {label: '↓ Rating', field: 'rating', direction: SortDirection.DESCENDING},
      {label: '↑ Reviews', field: 'reviewCount', direction: SortDirection.ASCENDING},
      {label: '↓ Reviews', field: 'reviewCount', direction: SortDirection.DESCENDING},
      {label: '↑ Publisher', field: 'publisher', direction: SortDirection.ASCENDING},
      {label: '↓ Publisher', field: 'publisher', direction: SortDirection.DESCENDING}
    ];
  }
}

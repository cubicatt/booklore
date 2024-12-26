import {Injectable} from '@angular/core';
import {Book} from '../model/book.model';
import {SortOption} from "../model/sort.model";

@Injectable({
  providedIn: 'root',
})
export class SortService {

  applySort(books: Book[], selectedSort: SortOption | null): Book[] {
    if (!selectedSort) return books;

    const { field, direction } = selectedSort;

    return books.sort((a, b) => {
      let valueA: any, valueB: any;
      if (field === 'title') {
        valueA = a.metadata?.title?.toLowerCase() || '';
        valueB = b.metadata?.title?.toLowerCase() || '';
      } else if (field === 'publishedDate') {
        valueA = new Date(a.metadata?.publishedDate || 0).getTime();
        valueB = new Date(b.metadata?.publishedDate || 0).getTime();
      }

      if (valueA === undefined || valueB === undefined) return 0;

      if (direction === 'ASCENDING') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
  }
}

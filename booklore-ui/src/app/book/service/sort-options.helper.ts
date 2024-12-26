import {SortDirection} from '../model/sort.model';

export class SortOptionsHelper {

  static generateSortOptions(): { label: string, field: string, direction: SortDirection }[] {
    return [
      {label: '↑ Title', field: 'title', direction: SortDirection.ASCENDING},
      {label: '↓ Title', field: 'title', direction: SortDirection.DESCENDING},
      {label: '↑ Published Date', field: 'publishedDate', direction: SortDirection.ASCENDING},
      {label: '↓ Published Date', field: 'publishedDate', direction: SortDirection.DESCENDING}
    ];
  }

}

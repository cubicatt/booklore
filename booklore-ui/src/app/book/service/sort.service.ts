import { Injectable } from '@angular/core';
import { SortOption } from '../model/sort-option.model';

@Injectable({
  providedIn: 'root',
})
export class SortService {
  private selectedSorts: { [key: string]: SortOption | null } = {};

  generateKey(entityType: string, entityId: number): string {
    if (entityType && entityId) {
      return `${entityType.toLowerCase()}-${entityId}`;
    }
    return '';
  }

  getSortOption(key: string): SortOption | null {
    return this.selectedSorts[key] || null;
  }

  setSortOption(key: string, sortOption: SortOption): void {
    this.selectedSorts[key] = sortOption;
  }
}


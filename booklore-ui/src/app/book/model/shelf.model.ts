import {SortOption} from './sort.model';

export interface Shelf {
  id?: number;
  name: string;
  sort?: SortOption;
}

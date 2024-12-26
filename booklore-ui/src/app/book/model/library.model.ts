import {SortOption} from './sort.model';

export interface Library {
  id?: number;
  name: string;
  sort?: SortOption;
  paths: string[];
}

import {SortOption} from './sort.model';

export interface Library {
  id?: number;
  name: string;
  icon: string;
  sort?: SortOption;
  paths: string[];
}

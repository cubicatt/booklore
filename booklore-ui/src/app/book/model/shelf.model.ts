import {Sort} from './sort.model';

export interface Shelf {
  id?: number;
  name: string;
  sort?: Sort;
}

import {BookMetadata} from './book.model';

export interface BookUpdateEvent {
  libraryId: number;
  filename: string;
  book: {
    id: number;
    libraryId: number;
    fileName: string;
    addedOn: string;
    metadata: BookMetadata;
  };
  parsingStatus: string;
}

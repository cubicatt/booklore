import { Book } from './book.model';

export interface BookNotification {
  action: Action;
  addedBook?: Book;
  removedBookIds?: Set<number>;
}

export enum Action {
  BOOK_ADDED = 'BOOK_ADDED',
  BOOKS_REMOVED = 'BOOKS_REMOVED',
}

export function parseBookNotification(messageBody: string): BookNotification {
  const raw = JSON.parse(messageBody);
  return {
    action: raw.action,
    addedBook: raw.addedBook,
    removedBookIds: raw.removedBookIds ? new Set<number>(raw.removedBookIds) : undefined,
  };
}

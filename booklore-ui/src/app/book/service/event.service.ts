import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private latestEventSubject = new BehaviorSubject<string>('No recent events...');
  latestEvent$ = this.latestEventSubject.asObservable();

  private eventHighlightSubject = new BehaviorSubject<boolean>(false);
  eventHighlight$ = this.eventHighlightSubject.asObservable();

  private eventTimeout: any;

  constructor() {}

  handleIncomingEvent(event: string): void {
    this.latestEventSubject.next(event);
    this.eventHighlightSubject.next(true);

    if (this.eventTimeout) {
      clearTimeout(this.eventTimeout);
    }

    this.eventTimeout = setTimeout(() => {
      this.eventHighlightSubject.next(false);
    }, 1000);

    setTimeout(() => {
      if (!this.eventHighlightSubject.value) {
        this.latestEventSubject.next('No recent events...');
      }
    }, 2500);
  }
}

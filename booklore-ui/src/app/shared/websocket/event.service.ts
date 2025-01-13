import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {LogNotification} from './model/log-notification.model';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private latestEventSubject = new BehaviorSubject<LogNotification>({message: 'No recent notifications...'});
  latestEvent$ = this.latestEventSubject.asObservable();

  private eventHighlightSubject = new BehaviorSubject<boolean>(false);
  eventHighlight$ = this.eventHighlightSubject.asObservable();

  private eventTimeout: any;

  handleIncomingLog(logNotification: LogNotification): void {
    this.latestEventSubject.next(logNotification);
    this.eventHighlightSubject.next(true);

    if (this.eventTimeout) {
      clearTimeout(this.eventTimeout);
    }

    this.eventTimeout = setTimeout(() => {
      this.eventHighlightSubject.next(false);
    }, 5000);

    setTimeout(() => {
      if (!this.eventHighlightSubject.value) {
        this.latestEventSubject.next({message: 'No recent notifications...'});
      }
    }, 12000);
  }
}

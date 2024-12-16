import {Component, OnInit, OnDestroy} from '@angular/core';
import {BookProgressService} from '../book/service/book-progress-service';
import {BookUpdateEvent} from '../book/model/book-update-event.model';
import {Subscription} from 'rxjs';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  imports: [
    NgClass
  ],
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  glowing: boolean = false;
  private eventSubscription!: Subscription;

  constructor(private bookProgressService: BookProgressService) {}

  ngOnInit(): void {
    /*this.eventSubscription = this.bookProgressService.connect(1).subscribe({
      next: (event: BookUpdateEvent) => {
        this.handleNewNotification(event);
      },
      error: (error) => {
        console.error('Error receiving progress updates:', error);
      }
    });*/
  }

  handleNewNotification(event: BookUpdateEvent): void {
    this.glowing = true;
    setTimeout(() => {
      this.glowing = false;
      console.log("reset")
    }, 200);
  }

  ngOnDestroy(): void {
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
    }
  }
}

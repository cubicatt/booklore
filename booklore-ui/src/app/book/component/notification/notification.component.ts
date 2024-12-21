import {Component, OnInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {NgClass} from '@angular/common';
import {BookUpdateEvent} from '../../model/book.model';

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

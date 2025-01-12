import {Component, OnInit} from '@angular/core';
import {RxStompService} from './shared/websocket/rx-stomp.service';
import {Message} from '@stomp/stompjs';
import {BookService} from './book/service/book.service';
import {EventService} from './shared/websocket/event.service';
import {parseLogNotification} from './shared/websocket/model/log-notification.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  constructor(private bookService: BookService, private rxStompService: RxStompService, private eventService: EventService) {
  }

  ngOnInit(): void {
    this.rxStompService.watch('/topic/book-add').subscribe((message: Message) => {
      this.bookService.handleNewlyCreatedBook(JSON.parse(message.body));
    });

    this.rxStompService.watch('/topic/books-removed').subscribe((message: Message) => {
      this.bookService.handleRemovedBookIds(JSON.parse(message.body));
    });

    this.rxStompService.watch('/topic/book-metadata-update').subscribe((message: Message) => {
      this.bookService.handleBookUpdate(JSON.parse(message.body));
    });

    this.rxStompService.watch('/topic/log').subscribe((message: Message) => {
      let logNotification = parseLogNotification(message.body);
      this.eventService.handleIncomingLog(logNotification);
    });
  }

  sendMessage() {
    const message = `Message generated at ${new Date()}`;
    this.rxStompService.publish({destination: '/app/send', body: message});
  }
}

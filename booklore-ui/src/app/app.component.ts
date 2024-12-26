import {Component, OnInit} from '@angular/core';
import {RxStompService} from './book/service/rx-stomp.service';
import {Message} from '@stomp/stompjs';
import {BookService} from './book/service/book.service';
import {Action, parseBookNotification} from './book/model/book-notification.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  constructor(private bookService: BookService, private rxStompService: RxStompService) {
  }

  ngOnInit(): void {
    this.rxStompService.watch('/topic/books').subscribe((message: Message) => {
      const notification = parseBookNotification(message.body);
      if (notification.action === Action.BOOK_ADDED) {
        this.bookService.handleNewlyCreatedBook(notification.addedBook!);
      } else if (notification.action === Action.BOOKS_REMOVED) {
        this.bookService.handleRemovedBookIds(notification.removedBookIds!);
      }
    });
  }

  sendMessage() {
    const message = `Message generated at ${new Date()}`;
    this.rxStompService.publish({destination: '/app/send', body: message});
  }
}

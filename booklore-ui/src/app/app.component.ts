import {Component, OnInit} from '@angular/core';
import {RxStompService} from './book/service/rx-stomp.service';
import {Message} from '@stomp/stompjs';
import {Book} from './book/model/book.model';
import {BookService} from './book/service/book.service';

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
      const book: Book = JSON.parse(message.body);
      this.bookService.handleNewlyCreatedBook(book);
    });
  }

  sendMessage() {
    const message = `Message generated at ${new Date()}`;
    this.rxStompService.publish({destination: '/app/send', body: message});
  }
}

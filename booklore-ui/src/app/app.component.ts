import {Component, OnInit} from '@angular/core';
import {RxStompService} from './rx-stomp.service';
import {Message} from '@stomp/stompjs';
import {LibraryAndBookService} from './book/service/library-and-book.service';
import {Book} from './book/model/book.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  constructor(private libraryBookService: LibraryAndBookService, private rxStompService: RxStompService) {
  }

  ngOnInit(): void {
    this.libraryBookService.initializeLibraries();
    this.rxStompService.watch('/topic/books').subscribe((message: Message) => {
      const book: Book = JSON.parse(message.body);
      this.libraryBookService.handleNewBook(book);
    });
  }

  sendMessage() {
    const message = `Message generated at ${new Date()}`;
    this.rxStompService.publish({destination: '/app/send', body: message});
  }
}

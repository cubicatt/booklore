import {Component, OnInit} from '@angular/core';
import {LibraryService} from './book/service/library.service';
import {RxStompService} from './rx-stomp.service';
import {Message} from '@stomp/stompjs';
import {BookService} from './book/service/book.service';
import {Book} from './book/model/book.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  constructor(private libraryService: LibraryService, private bookService: BookService, private rxStompService: RxStompService) {
  }

  ngOnInit(): void {
    this.libraryService.initializeLibraries();
    this.bookService.loadBooksSignal(1);


    this.rxStompService.watch('/topic/books').subscribe((message: Message) => {
      const book: Book = JSON.parse(message.body);  // Parse the incoming message to book DTO
      this.bookService.appendBookToLibrary(book);  // Call method to append to libraryBooks
    });
  }

  sendMessage() {
    const message = `Message generated at ${new Date()}`;
    this.rxStompService.publish({destination: '/app/send', body: message});
  }
}

import {Component} from '@angular/core';
import {LibraryService} from './book/service/library.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(private libraryService: LibraryService) {
  }
}

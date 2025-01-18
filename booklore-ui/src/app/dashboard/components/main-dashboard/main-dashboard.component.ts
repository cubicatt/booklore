import {Component, inject, OnInit} from '@angular/core';
import {LibraryCreatorComponent} from '../../../book/components/library-creator/library-creator.component';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {LibraryService} from '../../../book/service/library.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Button} from 'primeng/button';
import {AsyncPipe, NgIf} from '@angular/common';
import {DashboardScrollerComponent} from '../dashboard-scroller/dashboard-scroller.component';
import {BookService} from '../../../book/service/book.service';

@Component({
  selector: 'app-main-dashboard',
  templateUrl: './main-dashboard.component.html',
  styleUrls: ['./main-dashboard.component.scss'],
  imports: [
    Button,
    NgIf,
    DashboardScrollerComponent,
    AsyncPipe
  ],
  providers: [DialogService],
})
export class MainDashboardComponent implements OnInit {
  ref: DynamicDialogRef | undefined;

  private bookService = inject(BookService);

  ngOnInit(): void {
    this.bookService.loadBooks();
  }

  isLibrariesEmpty$: Observable<boolean> = inject(LibraryService).libraryState$.pipe(
    map(state => !state.libraries || state.libraries.length === 0)
  );

  createNewLibrary() {
    this.ref = inject(DialogService).open(LibraryCreatorComponent, {
      header: 'Create New Library',
      modal: true,
      closable: true,
      width: '675px',
      height: '480px',
      style: {
        position: 'absolute',
        top: '15%',
      }
    });
  }

}

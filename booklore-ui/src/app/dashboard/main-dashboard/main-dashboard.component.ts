import {Component} from '@angular/core';
import {LibraryCreatorComponent} from '../../book/library-creator/library-creator.component';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {LibraryService} from '../../book/service/library.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Button} from 'primeng/button';
import {AsyncPipe, NgIf} from '@angular/common';
import {DashboardScrollerComponent} from '../dashboard-scroller/dashboard-scroller.component';

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
export class MainDashboardComponent {
  isLibrariesEmpty$: Observable<boolean>;
  ref: DynamicDialogRef | undefined;

  constructor(private libraryService: LibraryService, public dialogService: DialogService) {
    this.isLibrariesEmpty$ = this.libraryService.libraryState$.pipe(
      map(state => !state.libraries || state.libraries.length === 0)
    );
  }

  createNewLibrary() {
    this.ref = this.dialogService.open(LibraryCreatorComponent, {
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

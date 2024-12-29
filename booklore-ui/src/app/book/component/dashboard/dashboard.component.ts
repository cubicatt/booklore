import { Component } from '@angular/core';
import { Button } from 'primeng/button';
import { AsyncPipe, NgIf } from '@angular/common';
import { LibraryCreatorComponent } from '../library-creator/library-creator.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DashboardScrollerComponent } from '../dashboard-scroller/dashboard-scroller.component';
import { LibraryService } from '../../service/library.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home-page',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    Button,
    NgIf,
    DashboardScrollerComponent,
    AsyncPipe
  ],
  providers: [DialogService],
})
export class DashboardComponent {
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
      width: '50%',
      height: '50%',
      style: { bottom: '15%' }
    });
  }
}

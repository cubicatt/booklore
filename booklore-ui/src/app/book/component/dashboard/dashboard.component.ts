import {Component} from '@angular/core';
import {Button, ButtonDirective} from 'primeng/button';
import {AsyncPipe, NgIf} from '@angular/common';
import {LibraryCreatorComponent} from '../library-creator/library-creator.component';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {DashboardScrollerComponent} from '../dashboard-scroller/dashboard-scroller.component';
import {LibraryService} from '../../service/library.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {IconPickerComponent} from '../icon-picker/icon-picker.component';

@Component({
  selector: 'app-home-page',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    Button,
    NgIf,
    DashboardScrollerComponent,
    AsyncPipe,
    IconPickerComponent
  ],
  providers: [DialogService],
})
export class DashboardComponent {
  isLibrariesEmpty$: Observable<boolean>;
  ref: DynamicDialogRef | undefined;

  constructor(private libraryService: LibraryService, public dialogService: DialogService) {
    this.isLibrariesEmpty$ = this.libraryService.libraries$.pipe(
      map(libraries => libraries.length === 0)
    );
  }

  createNewLibrary(event: MouseEvent) {
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();
    const dialogWidthPercentage = 50;
    const viewportWidth = window.innerWidth;
    const dialogWidth = (dialogWidthPercentage / 100) * viewportWidth;
    const leftPosition = buttonRect.left + (buttonRect.width / 2) - (dialogWidth / 2);
    this.ref = this.dialogService.open(LibraryCreatorComponent, {
      modal: true,
      width: `${dialogWidthPercentage}%`,
      height: 'auto',
      style: {
        position: 'absolute',
        top: `${buttonRect.bottom + 10}px`,
        left: `${Math.max(leftPosition, 0)}px`
      },
    });
  }
}

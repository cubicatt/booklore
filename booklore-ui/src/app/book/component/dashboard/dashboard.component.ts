import { Component, WritableSignal } from '@angular/core';
import { LibraryService } from '../../service/library.service';
import { Library } from '../../model/library.model';
import { Button } from 'primeng/button';
import { NgIf } from '@angular/common';
import { LibraryCreatorComponent } from '../library-creator/library-creator.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import {DashboardScrollerComponent} from '../dashboard-scroller/dashboard-scroller.component';

@Component({
  selector: 'app-home-page',
  templateUrl: './dashboard.component.html',
  imports: [
    Button,
    NgIf,
    DashboardScrollerComponent
  ],
  styleUrls: ['./dashboard.component.scss'],
  providers: [DialogService],
})
export class DashboardComponent {
  private libraries: WritableSignal<Library[]>;
  ref: DynamicDialogRef | undefined;

  constructor(private libraryService: LibraryService, public dialogService: DialogService) {
    this.libraries = this.libraryService.libraries;
  }

  get isLibrariesEmpty(): boolean {
    return this.libraries()?.length === 0;
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

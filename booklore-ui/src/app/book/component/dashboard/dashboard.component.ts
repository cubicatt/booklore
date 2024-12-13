import { Component, WritableSignal } from '@angular/core';
import { LibraryService } from '../../service/library.service';
import { Library } from '../../model/library.model';
import { Button } from 'primeng/button';
import { NgIf } from '@angular/common';
import { LibraryCreatorComponent } from '../library-creator/library-creator.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-home-page',
  templateUrl: './dashboard.component.html',
  imports: [
    Button,
    NgIf
  ],
  styleUrls: ['./dashboard.component.scss'],
  providers: [DialogService], // Ensure the DialogService is available
})
export class DashboardComponent {
  private libraries: WritableSignal<Library[]>;
  ref: DynamicDialogRef | undefined;

  constructor(private libraryService: LibraryService, public dialogService: DialogService) {
    this.libraries = this.libraryService.libraries;
  }

  get isLibrariesEmpty(): boolean {
    return this.libraries()?.length === 1;
  }

  createNewLibrary(event: MouseEvent) {
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();

    const dialogWidthPercentage = 50; // Use percentage-based width
    const viewportWidth = window.innerWidth;
    const dialogWidth = (dialogWidthPercentage / 100) * viewportWidth;

    const leftPosition = buttonRect.left + (buttonRect.width / 2) - (dialogWidth / 2);

    this.ref = this.dialogService.open(LibraryCreatorComponent, {
      modal: true,
      width: `${dialogWidthPercentage}%`, // Dynamic width
      height: 'auto', // Let height adapt to content
      style: {
        position: 'absolute',
        top: `${buttonRect.bottom + 10}px`, // Position below the button
        left: `${Math.max(leftPosition, 0)}px`, // Ensure it stays within the viewport
      },
    });
  }
}

import {Component, ViewChild} from '@angular/core';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {DirectoryPickerComponent} from '../directory-picker/directory-picker.component';
import {MessageService} from 'primeng/api';
import {Router} from '@angular/router';
import {LibraryService} from '../../service/library.service';
import {IconPickerComponent} from '../icon-picker/icon-picker.component';
import {take} from 'rxjs';

@Component({
  selector: 'app-library-creator',
  standalone: false,
  templateUrl: './library-creator.component.html',
  styleUrl: './library-creator.component.scss'
})
export class LibraryCreatorComponent {

  @ViewChild(IconPickerComponent) iconPicker: IconPickerComponent | undefined;

  libraryName: string = '';
  folders: string[] = [];
  ref: DynamicDialogRef | undefined;
  selectedIcon: string | null = null;

  constructor(
    private dialogService: DialogService,
    private dynamicDialogRef: DynamicDialogRef,
    private libraryService: LibraryService,
    private messageService: MessageService,
    private router: Router) {
  }

  show() {
    this.ref = this.dialogService.open(DirectoryPickerComponent, {
      header: 'Select Media Directory',
      modal: true,
      width: '50%',
      height: '75%',
      contentStyle: {overflow: 'auto'},
      baseZIndex: 10
    });

    this.ref.onClose.subscribe((selectedFolder: string) => {
      if (selectedFolder) {
        this.addFolder(selectedFolder);
      }
    });
  }

  addFolder(folder: string): void {
    this.folders.push(folder);
  }

  removeFolder(index: number): void {
    this.folders.splice(index, 1);
  }

  openIconPicker() {
    if (this.iconPicker) {
      this.iconPicker.open();
    }
  }

  onIconSelected(icon: string) {
    this.selectedIcon = icon;
  }

  clearSelectedIcon() {
    this.selectedIcon = null;
  }

  isLibraryDetailsValid(): boolean {
    return !!this.libraryName.trim() && !!this.selectedIcon;
  }

  isDirectorySelectionValid(): boolean {
    return this.folders.length > 0;
  }

  addLibrary() {
    const newLibrary = {
      name: this.libraryName,
      paths: this.folders,
      icon: this.selectedIcon ? this.selectedIcon.replace('pi pi-', '') : 'heart'
    };
    this.libraryService.createLibrary(newLibrary).subscribe({
      next: (createdLibrary) => {
        this.router.navigate(
          ['/library', createdLibrary.id, 'books']
        );
      },
      error: (err) => {
        console.error('Failed to create library:', err);
      }
    });
    this.dynamicDialogRef.close();
  }

  validateLibraryNameAndProceed(activateCallback: Function) {
    if (this.libraryName.trim()) {
      const libraryName = this.libraryName.trim();
      this.libraryService.libraryState$
        .pipe(take(1))
        .subscribe(libraryState => {
          const library = libraryState.libraries?.find(library => library.name === libraryName);
          if (library) {
            this.messageService.add({
              severity: 'error',
              summary: 'Library Name Exists',
              detail: 'This library name is already taken.',
            });
          } else {
            activateCallback(2);
          }
        });
    }
  }

}

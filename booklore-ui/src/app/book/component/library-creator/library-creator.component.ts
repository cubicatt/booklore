import {Component} from '@angular/core';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {DirectoryPickerComponent} from '../directory-picker/directory-picker.component';
import {MessageService} from 'primeng/api';
import {LibraryService} from '../../service/library.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-library-creator',
  standalone: false,
  templateUrl: './library-creator.component.html',
  styleUrl: './library-creator.component.scss',
  providers: [MessageService]
})
export class LibraryCreatorComponent {
  value: string = '';
  folders: string[] = [];
  ref: DynamicDialogRef | undefined;

  constructor(
    public dialogService: DialogService,
    private dynamicDialogRef: DynamicDialogRef,
    private messageService: MessageService,
    private libraryServiceV2: LibraryService,
    private router: Router,
  ) {
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

  addLibrary() {
    const newLibrary = {
      name: this.value,
      paths: this.folders,
    };
    this.libraryServiceV2.createLibrary(newLibrary).subscribe({
      next: (createdLibrary) => {
        console.log('Library successfully created:', createdLibrary);
        this.router.navigate(
          ['/library', createdLibrary.id, 'books'],
          {queryParams: {watch: true}}
        );
      },
      error: (err) => {
        console.error('Failed to create library:', err);
      }
    });
    this.dynamicDialogRef.close();
  }

  validateLibraryNameAndProceed(nextCallback: any) {
    if (this.value.trim()) {
      this.libraryServiceV2.checkLibraryNameExists(this.value).subscribe(
        (response) => {
          const libraryExists = response && response.name === this.value;
          if (libraryExists) {
            this.messageService.add({
              severity: 'error',
              summary: 'Library Name Exists',
              detail: 'This library name is already taken.',
            });
          } else {
            nextCallback.emit();
          }
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An error occurred while checking the library name.',
          });
        }
      );
    }
  }
}

import {Component} from '@angular/core';
import {Library} from '../../book/model/library.model';
import {FileUploadService} from '../../book/service/file-upload.service';
import {Button} from 'primeng/button';
import {AsyncPipe, NgIf} from '@angular/common';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule} from '@angular/forms';
import {ToastService} from '../../book/service/toast.service';
import {DynamicDialogRef} from 'primeng/dynamicdialog';
import {LibraryService} from '../../book/service/library.service';
import {Observable} from 'rxjs';
import {LibraryState} from '../../book/model/state/library-state.model';

@Component({
  selector: 'app-file-upload-v2',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  imports: [
    Button,
    NgIf,
    DropdownModule,
    FormsModule,
    AsyncPipe
  ],
})
export class FileUploadComponent {
  libraryState$: Observable<LibraryState>;
  selectedLibrary: Library | null = null;
  selectedPath: string = '';
  selectedFileName: string = '';
  isUploading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private libraryService: LibraryService,
    private fileUploadService: FileUploadService,
    private toastService: ToastService,
    private dynamicDialogRef: DynamicDialogRef) {
      this.libraryState$ = this.libraryService.libraryState$;
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.files) {
      const file = input.files[0];
      if (file) {
        this.selectedFileName = file.name;
      }
    }
  }

  isFormValid(): boolean {
    return !!this.selectedLibrary && !!this.selectedPath && !!this.selectedFileName;
  }

  uploadFile(): void {
    this.errorMessage = null;
    if (!this.isFormValid()) {
      return;
    }
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return;
    }
    const file = fileInput.files[0];
    const libraryId = this.selectedLibrary?.id ? this.selectedLibrary.id.toString() : '';
    const path = this.selectedPath || '';
    this.isUploading = true;
    this.fileUploadService.uploadFile(file, libraryId, path)
      .subscribe(
        (response) => {
          console.log('File uploaded successfully');
          this.toastService.showSuccess("File uploaded", file.name);
          this.isUploading = false;
          this.dynamicDialogRef.close();
        },
        (error) => {
          this.isUploading = false;
          this.toastService.showError("Upload failed", error.error.message);
          this.errorMessage = "Upload failed. " + error.error.message + ".";
        }
      );
  }
}

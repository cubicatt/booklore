import {Component, inject} from '@angular/core';
import {FileProgressEvent, FileSendEvent, FileUpload, FileUploadErrorEvent, FileUploadEvent} from 'primeng/fileupload';
import {Button} from 'primeng/button';
import {LibraryService} from '../../../book/service/library.service';
import {Observable} from 'rxjs';
import {LibraryState} from '../../../book/model/state/library-state.model';
import {AsyncPipe, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Library, LibraryPath} from '../../../book/model/library.model';
import {MessageService} from 'primeng/api';
import {DynamicDialogRef} from 'primeng/dynamicdialog';
import {Select} from 'primeng/select';
import {API_CONFIG} from '../../../config/api-config';

@Component({
  selector: 'app-book-uploader',
  imports: [
    FileUpload,
    Button,
    AsyncPipe,
    FormsModule,
    NgIf,
    Select
  ],
  templateUrl: './book-uploader.component.html',
  styleUrl: './book-uploader.component.scss'
})
export class BookUploaderComponent {

  private uploadUrl = `${API_CONFIG.BASE_URL}/api/v1/files/upload`;

  private libraryService = inject(LibraryService);
  private messageService = inject(MessageService);
  private dynamicDialogRef = inject(DynamicDialogRef);

  libraryState$: Observable<LibraryState> = this.libraryService.libraryState$;

  selectedLibrary: Library | null = null;
  selectedPath: LibraryPath | null = null;
  isUploading = false;
  progressPercent = 0;
  errorMessage: string | null = null;

  getUploadUrl() {
    return `${this.uploadUrl}?libraryId=${this.selectedLibrary?.id}&pathId=${this.selectedPath?.id}`;
  }

  onSelect() {
    this.errorMessage = null;
  }

  onClear($event: Event) {
    this.errorMessage = null;
  }

  onSend($event: FileSendEvent) {
    this.errorMessage = null;
    this.isUploading = true;
  }

  onProgress($event: FileProgressEvent) {
    this.progressPercent = $event.progress;
  }

  onUpload($event: FileUploadEvent) {
    this.dynamicDialogRef.close();
    this.messageService.add({severity: 'success', summary: 'Success', detail: 'Book successfully uploaded'});
    this.isUploading = false;
    this.progressPercent = 0;
  }

  onError($event: FileUploadErrorEvent) {
    let error: any = $event.error;
    if (error?.status === 409) {
      this.errorMessage = 'File already exists';
      this.messageService.add({
        severity: 'error',
        summary: 'Upload Failed',
        detail: 'The file already exists.'
      });
    } else {
      this.errorMessage = 'Upload failed';
      this.messageService.add({
        severity: 'error',
        summary: 'Upload Failed',
        detail: 'There was an error uploading the file.'
      });
    }
    this.isUploading = false;
    this.progressPercent = 0;
  }
}

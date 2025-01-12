import {Component} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {MetadataAdvancedFetchOptionsComponent} from '../metadata-advanced-fetch-options/metadata-advanced-fetch-options.component';
import {Divider} from 'primeng/divider';
import {Button} from 'primeng/button';
import {MetadataBasicFetchOptionsComponent} from '../metadata-basic-fetch-options/metadata-basic-fetch-options.component';
import {NgIf} from '@angular/common';
import {MetadataService} from '../../metadata.service';
import {MetadataRefreshRequest} from '../../model/request/metadata-refresh-request.model';
import {MetadataRefreshType} from '../../model/request/metadata-refresh-type.enum';
import {MessageService} from 'primeng/api';
import {MetadataRefreshOptions} from '../../model/request/metadata-refresh-options.model';

@Component({
  selector: 'app-metadata-fetch-options',
  standalone: true,
  templateUrl: './metadata-fetch-options.component.html',
  imports: [
    MetadataAdvancedFetchOptionsComponent,
    Divider,
    Button,
    MetadataBasicFetchOptionsComponent,
    NgIf
  ],
  styleUrl: './metadata-fetch-options.component.scss'
})
export class MetadataFetchOptionsComponent {
  isBasicMode: boolean = true;
  libraryId!: number;
  bookIds!: Set<number>;
  metadataRefreshType!: MetadataRefreshType;

  constructor(private dynamicDialogConfig: DynamicDialogConfig,
              private dynamicDialogRef: DynamicDialogRef,
              private metadataService: MetadataService,
              private messageService: MessageService) {
    this.libraryId = dynamicDialogConfig.data.libraryId;
    this.bookIds = dynamicDialogConfig.data.bookIds;
    this.metadataRefreshType = dynamicDialogConfig.data.metadataRefreshType;
  }

  toggleMode() {
    this.isBasicMode = !this.isBasicMode;
  }

  onMetadataSubmit(metadataRefreshOptions: MetadataRefreshOptions) {
    const metadataRefreshRequest: MetadataRefreshRequest = {
      refreshType: this.metadataRefreshType,
      refreshOptions: metadataRefreshOptions,
      ...(this.metadataRefreshType === 'BOOKS' && this.bookIds != null && {bookIds: this.bookIds}),
      ...(this.metadataRefreshType === 'LIBRARY' && this.libraryId != null && {libraryId: this.libraryId})
    };
    this.metadataService.autoRefreshMetadata(metadataRefreshRequest).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Metadata Update Scheduled',
          detail: 'The metadata update for the selected books has been successfully scheduled.'
        });
      },
      error: (e) => {
        if (e.status === 409) {
          this.messageService.add({
            severity: 'error',
            summary: 'Task Already Running',
            life: 5000,
            detail: 'A metadata refresh task is already in progress. Please wait for it to complete before starting another one.'
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Metadata Update Failed',
            life: 5000,
            detail: 'An unexpected error occurred while scheduling the metadata update. Please try again later or contact support if the issue persists.'
          });
        }
      }
    });
    this.dynamicDialogRef.close();
  }
}

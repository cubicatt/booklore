import {Component, inject} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {MetadataAdvancedFetchOptionsComponent} from '../metadata-advanced-fetch-options/metadata-advanced-fetch-options.component';
import {Divider} from 'primeng/divider';
import {Button} from 'primeng/button';
import {MetadataBasicFetchOptionsComponent} from '../metadata-basic-fetch-options/metadata-basic-fetch-options.component';
import {NgIf} from '@angular/common';
import {MetadataService} from '../../service/metadata.service';
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
  bookIds!: number[];
  metadataRefreshType!: MetadataRefreshType;

  private dynamicDialogConfig = inject(DynamicDialogConfig);
  private dynamicDialogRef = inject(DynamicDialogRef);
  private metadataService = inject(MetadataService);
  private messageService = inject(MessageService);


  constructor() {
    this.libraryId = this.dynamicDialogConfig.data.libraryId;
    this.bookIds = this.dynamicDialogConfig.data.bookIds;
    this.metadataRefreshType = this.dynamicDialogConfig.data.metadataRefreshType;
  }

  toggleMode() {
    this.isBasicMode = !this.isBasicMode;
  }

  onMetadataSubmit(metadataRefreshOptions: MetadataRefreshOptions) {
    const metadataRefreshRequest: MetadataRefreshRequest = {
      refreshType: this.metadataRefreshType,
      refreshOptions: metadataRefreshOptions,
      bookIds: this.bookIds,
      libraryId: this.libraryId
    };
    this.metadataService.autoRefreshMetadata(metadataRefreshRequest).subscribe();
    this.dynamicDialogRef.close();
  }
}

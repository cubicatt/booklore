import {Component} from '@angular/core';
import {DynamicDialogConfig} from 'primeng/dynamicdialog';
import {MetadataAdvancedFetchOptionsComponent, MetadataRefreshOptions} from '../metadata-advanced-fetch-options/metadata-advanced-fetch-options.component';
import {Divider} from 'primeng/divider';
import {Button} from 'primeng/button';
import {MetadataBasicFetchOptionsComponent} from '../metadata-basic-fetch-options/metadata-basic-fetch-options.component';
import {NgIf} from '@angular/common';
import {MetadataService} from '../book/service/metadata.service';

export interface MetadataRefreshRequest {
  refreshType: RefreshType;
  libraryId?: number;
  bookIds?: Set<number>;
  refreshOptions: MetadataRefreshOptions;
}

enum RefreshType {
  BOOKS = 'BOOKS',
  LIBRARY = 'LIBRARY'
}

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
  isBasicMode: boolean = false;
  libraryId!: number;

  constructor(private dynamicDialogConfig: DynamicDialogConfig, private metadataService: MetadataService) {
    this.libraryId = dynamicDialogConfig.data.libraryId;
  }

  toggleMode() {
    this.isBasicMode = !this.isBasicMode;
  }

  onAdvancedMetadataOptionSubmit(metadataRefreshOptions: MetadataRefreshOptions) {
    const metadataRefreshRequest: MetadataRefreshRequest = {
      refreshType: RefreshType.LIBRARY,
      libraryId: this.libraryId,
      refreshOptions: metadataRefreshOptions
    };
    this.metadataService.autoRefreshLibraryBooksMetadataV2(metadataRefreshRequest).subscribe({
      next: () => {
        // Handle success
      },
      error: (error) => {
        // Handle error
      }
    });
  }
}

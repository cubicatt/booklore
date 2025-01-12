import {Component} from '@angular/core';
import {DynamicDialogConfig} from 'primeng/dynamicdialog';
import {MetadataAdvancedFetchOptionsComponent} from '../metadata-advanced-fetch-options/metadata-advanced-fetch-options.component';
import {Divider} from 'primeng/divider';
import {Button} from 'primeng/button';
import {MetadataBasicFetchOptionsComponent} from '../metadata-basic-fetch-options/metadata-basic-fetch-options.component';
import {NgIf} from '@angular/common';

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
  isDialogVisible: boolean = false;
  libraryId!: number;

  constructor(private dynamicDialogConfig: DynamicDialogConfig) {
    this.libraryId = dynamicDialogConfig.data.libraryId;
  }

  toggleMode() {
    this.isBasicMode = !this.isBasicMode;
  }

  openDialog() {
    this.isDialogVisible = true;
  }

  // Close the dialog (if needed)
  closeDialog() {
    this.isDialogVisible = false;
  }

}

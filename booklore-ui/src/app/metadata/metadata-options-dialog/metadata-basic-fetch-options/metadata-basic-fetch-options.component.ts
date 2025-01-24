import {Component, EventEmitter, Output} from '@angular/core';
import {Button} from 'primeng/button';
import {Checkbox} from 'primeng/checkbox';
import {Select} from 'primeng/select';
import {FormsModule} from '@angular/forms';
import {MetadataRefreshOptions} from '../../model/request/metadata-refresh-options.model';

@Component({
  selector: 'app-metadata-basic-fetch-options',
  standalone: true,
  templateUrl: './metadata-basic-fetch-options.component.html',
  styleUrl: './metadata-basic-fetch-options.component.scss',
  imports: [Button, Checkbox, Select, FormsModule]
})
export class MetadataBasicFetchOptionsComponent {
  providers: string[] = ['Amazon', 'Google', 'GoodReads'];
  selectedProvider!: string;
  refreshCovers: boolean = false;
  mergeCategories: boolean = false;

  @Output() metadataOptionsSubmitted: EventEmitter<MetadataRefreshOptions> = new EventEmitter<MetadataRefreshOptions>();

  submit() {
    const metadataRefreshOptions: MetadataRefreshOptions = {
      defaultProvider: this.selectedProvider,
      refreshCovers: this.refreshCovers,
      mergeCategories: this.mergeCategories
    };
    this.metadataOptionsSubmitted.emit(metadataRefreshOptions);
  }
}

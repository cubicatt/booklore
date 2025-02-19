import {Component, inject, OnInit} from '@angular/core';
import {MetadataAdvancedFetchOptionsComponent} from '../../../../metadata/metadata-options-dialog/metadata-advanced-fetch-options/metadata-advanced-fetch-options.component';
import {MetadataRefreshOptions} from '../../../../metadata/model/request/metadata-refresh-options.model';
import {AppSettingsService} from '../../../service/app-settings.service';
import {Observable} from 'rxjs';
import {AppSettings} from '../../../model/app-settings.model';
import {Tooltip} from 'primeng/tooltip';

@Component({
  selector: 'app-metadata-settings',
  imports: [
    MetadataAdvancedFetchOptionsComponent,
    Tooltip
  ],
  templateUrl: './metadata-settings.component.html',
  styleUrl: './metadata-settings.component.scss'
})
export class MetadataSettingsComponent implements OnInit {

  currentMetadataOptions!: MetadataRefreshOptions;

  private appSettingsService = inject(AppSettingsService);
  appSettings$: Observable<AppSettings | null> = this.appSettingsService.appSettings$;

  ngOnInit(): void {
    this.appSettings$.subscribe(settings => {
      if (settings) {
        this.currentMetadataOptions = settings.metadataRefreshOptions;
      }
    });
  }

  onMetadataSubmit(metadataRefreshOptions: MetadataRefreshOptions) {
    this.appSettingsService.saveAppSetting('quick_book_match', 'all_books', metadataRefreshOptions)
  }
}

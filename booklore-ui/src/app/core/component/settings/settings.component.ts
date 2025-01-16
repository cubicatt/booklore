import {Component, inject, OnInit} from '@angular/core';
import {AppSettingsService} from '../../service/app-settings.service';
import {Observable} from 'rxjs';
import {AppSettings} from '../../model/app-settings.model';
import {Select} from 'primeng/select';
import {FormsModule} from '@angular/forms';
import {NgForOf} from '@angular/common';
import {ToggleSwitch} from 'primeng/toggleswitch';
import {RadioButton} from 'primeng/radiobutton';
import {Divider} from 'primeng/divider';
import {Button} from 'primeng/button';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  imports: [
    Select,
    FormsModule,
    NgForOf,
    ToggleSwitch,
    RadioButton,
    Divider,
    Button
  ],
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  spreads = [
    {name: 'Even Spread', key: 'even'},
    {name: 'Odd Spread', key: 'odd'},
    {name: 'No Spread', key: 'off'}
  ];
  zooms = [
    {name: 'Auto Zoom', key: 'auto'},
    {name: 'Page Fit', key: 'page-fit'},
    {name: 'Page Width', key: 'page-width'},
    {name: 'Actual Size', key: 'page-actual'}
  ];
  themes = [
    {name: 'White', key: 'white'},
    {name: 'Black', key: 'black'},
    {name: 'Grey', key: 'grey'},
    {name: 'Sepia', key: 'sepia'}
  ];
  fonts = [
    {name: 'Serif', key: 'serif'},
    {name: 'Sans Serif', key: 'sans-serif'},
    {name: 'Roboto', key: 'roboto'},
    {name: 'Cursive', key: 'cursive'},
    {name: 'Monospace', key: 'monospace'}
  ];

  selectedSpread: any;
  selectedZoom: any;
  showSidebar = false;
  selectedTheme!: any;
  fontSize: number = 100;
  selectedFont: any;

  private appSettingsService = inject(AppSettingsService);
  appSettings$: Observable<AppSettings | null> = this.appSettingsService.appSettings$;


  ngOnInit(): void {
    this.appSettings$.subscribe(settings => {
      if (settings) {
        this.populateSettings(settings);
      }
    });
  }

  populateSettings(settings: AppSettings): void {
    if (settings.pdf) {
      const pdfSettings = settings.pdf;
      console.log(pdfSettings)


      this.selectedSpread = this.spreads.find(s => s.key === pdfSettings.spread)?.key;
      this.selectedZoom = this.zooms.find(z => z.key === pdfSettings.zoom)?.key;
      this.showSidebar = pdfSettings.sidebar;
    }

    if (settings.epub) {
      const epubSettings = settings.epub;
      this.selectedTheme = this.themes.find(t => t.key === epubSettings.theme)?.key;

      console.log(epubSettings.fontSize)
      this.fontSize = parseInt(epubSettings.fontSize, 10);
      this.selectedFont = this.fonts.find(f => f.key === epubSettings.font)?.key;
    }
  }

  onThemeChange(): void {
    this.appSettingsService.saveAppSetting('epub', 'theme', this.selectedTheme);
  }

  onFontChange(): void {
    this.appSettingsService.saveAppSetting('epub', 'font', this.selectedFont);
  }

  onSpreadChange(): void {
    this.appSettingsService.saveAppSetting('pdf', 'spread', this.selectedSpread);
  }

  onZoomChange(): void {
    this.appSettingsService.saveAppSetting('pdf', 'zoom', this.selectedZoom);
  }

  onSidebarChange(): void {
    this.appSettingsService.saveAppSetting('pdf', 'sidebar', this.showSidebar.toString());
  }

  onFontSizeChange(): void {
    this.appSettingsService.saveAppSetting('epub', 'fontSize', this.fontSize.toString());
  }

  increaseFontSize(): void {
    if (this.fontSize < 250) {
      this.fontSize += 10;
      this.onFontSizeChange();
    }
  }

  decreaseFontSize(): void {
    if (this.fontSize > 50) {
      this.fontSize -= 10;
      this.onFontSizeChange();
    }
  }
}

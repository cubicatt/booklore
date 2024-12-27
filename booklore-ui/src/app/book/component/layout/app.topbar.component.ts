import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {LayoutService} from './service/app.layout.service';
import {RouterLink} from '@angular/router';
import {DialogService as PrimeDialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {LibraryCreatorComponent} from '../library-creator/library-creator.component';
import {ThemeSwitcherComponent} from '../theme-switcher/theme-switcher.component';
import {TooltipModule} from 'primeng/tooltip';
import {FormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {SearchComponent} from '../search/search.component';
import {FileUploadComponent} from '../file-upload/file-upload.component';
import {NgClass, NgIf} from '@angular/common';
import {EventService} from '../../service/event.service';
import {LogNotification} from '../../model/log-notification.model';

@Component({
  selector: 'app-topbar',
  templateUrl: './app.topbar.component.html',
  styleUrls: ['./app.topbar.component.scss'],
  imports: [
    RouterLink,
    TooltipModule,
    FormsModule,
    InputTextModule,
    SearchComponent,
    ThemeSwitcherComponent,
    NgIf
  ],
})
export class AppTopBarComponent implements OnDestroy {
  items!: MenuItem[];
  ref: DynamicDialogRef | undefined;

  latestEvent: LogNotification = { message: 'No recent notifications...' };
  eventHighlight: boolean = false;
  showEvents: boolean = false;
  eventTimeout: any;

  @ViewChild('menubutton') menuButton!: ElementRef;
  @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
  @ViewChild('topbarmenu') menu!: ElementRef;

  constructor(public layoutService: LayoutService, public dialogService: PrimeDialogService, private eventService: EventService) {
    this.eventService.latestEvent$.subscribe(event => {
      this.latestEvent = event;
    });
    this.eventService.eventHighlight$.subscribe(highlight => {
      this.eventHighlight = highlight;
    });
  }

  onMouseEnter() {
    this.showEvents = true;
  }

  onMouseLeave() {
    this.showEvents = false;
  }

  toggleEventDisplay(): void {
    this.showEvents = !this.showEvents;
  }

  openLibraryCreatorDialog(): void {
    this.ref = this.dialogService.open(LibraryCreatorComponent, {
      header: 'Create New Library',
      modal: true,
      width: '40%',
      height: '50%',
      style: {bottom: '15%'}
    });
  }

  openFileUploadDialog() {
    this.ref = this.dialogService.open(FileUploadComponent, {
      header: 'Upload Book',
      modal: true,
      width: '45%',
      height: '40%',
      style: {bottom: '20%'}
    });
  }

  ngOnDestroy(): void {
    if (this.ref) {
      this.ref.close();
    }
    clearTimeout(this.eventTimeout);
  }
}

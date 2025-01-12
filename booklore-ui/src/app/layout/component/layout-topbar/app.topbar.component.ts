import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {LayoutService} from '../layout-main/service/app.layout.service';
import {RouterLink} from '@angular/router';
import {DialogService as PrimeDialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {LibraryCreatorComponent} from '../../../book/components/library-creator/library-creator.component';
import {TooltipModule} from 'primeng/tooltip';
import {FormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {BookSearcherComponent} from '../../../book/components/book-searcher/book-searcher.component';
import {FileUploadComponent} from '../../../utilities/component/file-upload/file-upload.component';
import {NgClass, NgIf} from '@angular/common';
import {EventService} from '../../../shared/websocket/event.service';
import {LogNotification} from '../../../shared/websocket/model/log-notification.model';
import {Button} from 'primeng/button';
import {StyleClass} from 'primeng/styleclass';
import {Divider} from 'primeng/divider';
import {ThemeConfiguratorComponent} from '../theme-configurator/theme-configurator.component';

@Component({
  selector: 'app-topbar',
  templateUrl: './app.topbar.component.html',
  styleUrls: ['./app.topbar.component.scss'],
  imports: [
    RouterLink,
    TooltipModule,
    FormsModule,
    InputTextModule,
    BookSearcherComponent,
    NgIf,
    Button,
    ThemeConfiguratorComponent,
    StyleClass,
    NgClass,
    Divider
  ],
})
export class AppTopBarComponent implements OnDestroy {
  items!: MenuItem[];
  ref: DynamicDialogRef | undefined;

  latestEvent: LogNotification = {message: 'No recent notifications...'};
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

  isMenuVisible: boolean = true;

  toggleMenu() {
    this.isMenuVisible = !this.isMenuVisible;
    this.layoutService.onMenuToggle();
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
      closable: true,
      width: '675px',
      height: '480px',
      style: {
        position: 'absolute',
        top: '15%',
      }
    });
  }

  openFileUploadDialog() {
    this.ref = this.dialogService.open(FileUploadComponent, {
      header: 'Upload Book',
      modal: true,
      closable: true,
      width: '600px',
      height: '330px',
      style: {
        position: 'absolute',
        top: '15%',
      }
    });
  }

  ngOnDestroy(): void {
    if (this.ref) {
      this.ref.close();
    }
    clearTimeout(this.eventTimeout);
  }
}

import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from './service/app.layout.service';
import { RouterLink } from '@angular/router';
import { DialogService as PrimeDialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LibraryCreatorComponent } from '../book/component/library-creator/library-creator.component';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SearchComponent } from '../book/component/search/search.component';
import { NotificationComponent } from '../notification/notification.component'; // Import the NotificationComponent

@Component({
  selector: 'app-topbar',
  imports: [
    RouterLink,
    TooltipModule,
    FormsModule,
    InputTextModule,
    SearchComponent,
    NotificationComponent  // Add NotificationComponent to imports
  ],
  templateUrl: './app.topbar.component.html',
})
export class AppTopBarComponent implements OnDestroy {
  items!: MenuItem[];
  ref: DynamicDialogRef | undefined;

  @ViewChild('menubutton') menuButton!: ElementRef;
  @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
  @ViewChild('topbarmenu') menu!: ElementRef;

  constructor(public layoutService: LayoutService, public dialogService: PrimeDialogService) {}

  openLibraryCreatorDialog(): void {
    this.ref = this.dialogService.open(LibraryCreatorComponent, {
      header: 'Create New Library',
      modal: false,
      width: '50%',
      height: '50%',
    });
  }

  ngOnDestroy(): void {
    if (this.ref) {
      this.ref.close();
    }
  }
}

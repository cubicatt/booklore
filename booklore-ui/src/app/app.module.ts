import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AppLayoutModule} from './layout/app.layout.module';
import {FormsModule} from '@angular/forms';
import {DialogService} from 'primeng/dynamicdialog';
import {DirectoryPickerComponent} from './book/component/directory-picker/directory-picker.component';
import {InputTextModule} from 'primeng/inputtext';
import {TableModule} from 'primeng/table';
import {Button} from 'primeng/button';
import {LibraryCreatorComponent} from './book/component/library-creator/library-creator.component';
import {StepperModule} from 'primeng/stepper';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {PasswordModule} from 'primeng/password';
import {ToastModule} from 'primeng/toast';
import {LibraryBrowserComponent} from './book/component/library-browser/library-browser.component';
import {InfiniteScrollDirective} from 'ngx-infinite-scroll';
import {SearchComponent} from './book/component/search/search.component';

@NgModule({
  declarations: [
    AppComponent,
    DirectoryPickerComponent,
    LibraryCreatorComponent,
    LibraryBrowserComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AppLayoutModule,
    FormsModule,
    InputTextModule,
    TableModule,
    Button,
    StepperModule,
    IconFieldModule,
    InputIconModule,
    ToggleButtonModule,
    PasswordModule,
    ToastModule,
    InfiniteScrollDirective,
    SearchComponent,
  ],
  providers: [DialogService],
  bootstrap: [AppComponent]
})
export class AppModule { }

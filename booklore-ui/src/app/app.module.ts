import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AppLayoutModule} from './book/component/layout/app.layout.module';
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
import {InfiniteScrollDirective} from 'ngx-infinite-scroll';
import {SearchComponent} from './book/component/search/search.component';
import {ConfirmationService, MessageService} from 'primeng/api';
import {DropdownModule} from 'primeng/dropdown';
import {rxStompServiceFactory} from './rx-stomp-service-factory';
import {RxStompService} from './rx-stomp.service';
import {VirtualScrollerModule} from '@iharbeck/ngx-virtual-scroller';
import {LazyLoadImageModule} from 'ng-lazyload-image';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ShelfAssignerComponent} from './book/component/shelf-assigner/shelf-assigner.component';
import {CheckboxModule} from 'primeng/checkbox';
import {DividerModule} from 'primeng/divider';
import {DialogModule} from 'primeng/dialog';
import {BooksBrowserComponent} from './book/component/books-browser/books-browser.component';
import {BookCardComponent} from './book/component/book-card/book-card.component';
import {SpeedDialModule} from 'primeng/speeddial';
import {RouteReuseStrategy} from '@angular/router';
import {CustomReuseStrategy} from './custom-reuse-strategy';

@NgModule({
  declarations: [
    AppComponent,
    DirectoryPickerComponent,
    LibraryCreatorComponent,
    ShelfAssignerComponent,
    BooksBrowserComponent
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
    DropdownModule,
    VirtualScrollerModule,
    LazyLoadImageModule,
    ConfirmDialogModule,
    CheckboxModule,
    DividerModule,
    DialogModule,
    BookCardComponent,
    SpeedDialModule,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService,
    {
      provide: RxStompService,
      useFactory: rxStompServiceFactory,
    },
    {
      provide: RouteReuseStrategy,
      useClass: CustomReuseStrategy
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}

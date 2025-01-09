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
import {rxStompServiceFactory} from './book/service/rx-stomp-service-factory';
import {RxStompService} from './book/service/rx-stomp.service';
import {VirtualScrollerModule} from '@iharbeck/ngx-virtual-scroller';
import {LazyLoadImageModule} from 'ng-lazyload-image';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ShelfAssignerComponent} from './book/component/shelf-assigner/shelf-assigner.component';
import {CheckboxModule} from 'primeng/checkbox';
import {DividerModule} from 'primeng/divider';
import {DialogModule} from 'primeng/dialog';
import {BookBrowserComponent} from './book/component/book-browser/book-browser.component';
import {BookCardComponent} from './book/component/book-card/book-card.component';
import {SpeedDialModule} from 'primeng/speeddial';
import {RouteReuseStrategy} from '@angular/router';
import {CustomReuseStrategy} from './custom-reuse-strategy';
import {MenuModule} from 'primeng/menu';
import {IconPickerComponent} from './book/component/icon-picker/icon-picker.component';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {providePrimeNG} from 'primeng/config';
import Aura from '@primeng/themes/aura';
import {IftaLabel} from 'primeng/iftalabel';
import {LoadingOverlayComponent} from './loading-overlay/loading-overlay.component';
import {MultiSelectModule} from 'primeng/multiselect';
import {SelectButton} from "primeng/selectbutton";
import {BookTableComponent} from './book/component/book-table/book-table.component';
import {RadioButton} from 'primeng/radiobutton';
import {Select} from 'primeng/select';

@NgModule({
    declarations: [
        AppComponent,
        DirectoryPickerComponent,
        LibraryCreatorComponent,
        ShelfAssignerComponent,
        BookBrowserComponent
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
    MenuModule,
    IconPickerComponent,
    ProgressSpinnerModule,
    IftaLabel,
    LoadingOverlayComponent,
    MultiSelectModule,
    SelectButton,
    BookTableComponent,
    RadioButton,
    Select
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
        },
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura
            }
        })
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}

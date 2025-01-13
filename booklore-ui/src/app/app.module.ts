import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';

import {FormsModule} from '@angular/forms';
import {DialogService} from 'primeng/dynamicdialog';
import {InputTextModule} from 'primeng/inputtext';
import {TableModule} from 'primeng/table';
import {Button} from 'primeng/button';
import {StepperModule} from 'primeng/stepper';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {PasswordModule} from 'primeng/password';
import {ToastModule} from 'primeng/toast';
import {InfiniteScrollDirective} from 'ngx-infinite-scroll';
import {ConfirmationService, MessageService} from 'primeng/api';
import {DropdownModule} from 'primeng/dropdown';
import {rxStompServiceFactory} from './shared/websocket/rx-stomp-service-factory';
import {RxStompService} from './shared/websocket/rx-stomp.service';
import {VirtualScrollerModule} from '@iharbeck/ngx-virtual-scroller';
import {LazyLoadImageModule} from 'ng-lazyload-image';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {CheckboxModule} from 'primeng/checkbox';
import {DividerModule} from 'primeng/divider';
import {DialogModule} from 'primeng/dialog';
import {SpeedDialModule} from 'primeng/speeddial';
import {RouteReuseStrategy} from '@angular/router';
import {CustomReuseStrategy} from './custom-reuse-strategy';
import {MenuModule} from 'primeng/menu';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {providePrimeNG} from 'primeng/config';
import Aura from '@primeng/themes/aura';
import {IftaLabel} from 'primeng/iftalabel';
import {MultiSelectModule} from 'primeng/multiselect';
import {SelectButton} from "primeng/selectbutton";
import {RadioButton} from 'primeng/radiobutton';
import {Select} from 'primeng/select';
import {provideHttpClient} from "@angular/common/http";

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
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
        DropdownModule,
        VirtualScrollerModule,
        LazyLoadImageModule,
        ConfirmDialogModule,
        CheckboxModule,
        DividerModule,
        DialogModule,
        SpeedDialModule,
        MenuModule,
        ProgressSpinnerModule,
        IftaLabel,
        MultiSelectModule,
        SelectButton,
        RadioButton,
        Select
    ],
    providers: [
        provideHttpClient(),
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

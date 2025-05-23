import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

// Import Kendo UI modules
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { LayoutModule } from '@progress/kendo-angular-layout';
import { ProgressBarModule } from '@progress/kendo-angular-progressbar';
import { ChartsModule } from '@progress/kendo-angular-charts';
import { IntlModule } from '@progress/kendo-angular-intl';

// App components
import { BibleTrackerModule } from './bible-tracker/bible-tracker.module';
import { AppComponent } from './app.component';

// For charts
import 'hammerjs';

@NgModule({
  declarations: [],
  imports: [
    AppComponent,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    BibleTrackerModule,

    // Kendo UI modules
    ButtonsModule,
    DialogsModule,
    DropDownsModule,
    InputsModule,
    IntlModule,
    LayoutModule,
    ProgressBarModule,
    ChartsModule
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi())
  ],
  bootstrap: [],
  exports: [],
})
export class AppModule { }
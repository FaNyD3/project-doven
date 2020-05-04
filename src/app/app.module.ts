import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {NgForageModule, NgForageConfig, Driver} from 'ngforage';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { MaterialModule } from './material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { ServicesModule } from './services/services.module';
import { QuillModule } from 'ngx-quill';
import { MessageModalComponent } from './modals/message-modal/message-modal.component';
import { PagesComponent } from './pages/pages.component';
// import { CancelModalComponent } from './modals/cancel-modal/canceL-modal.component';
import { NoteComponent } from "./modals/note/note.component";
import {ReminderComponent} from "./pages/reminders/reminder/reminder.component";
import {CrudClientComponent} from "./pages/clients/clients-table/crud-client/crud-client.component";
import {HTTP_INTERCEPTORS} from "@angular/common/http";
import {TokenInterceptor} from "./helpers/token.interceptor";
import {ErrorInterceptor} from "./helpers/error.interceptor";

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MessageModalComponent,
    PagesComponent,
    // CancelModalComponent,
    CrudClientComponent,
    NoteComponent,
    ReminderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    ServicesModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    QuillModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    MessageModalComponent,
    CrudClientComponent,
    NoteComponent,
    ReminderComponent
  ]
})
export class AppModule {
  public constructor(ngfConfig: NgForageConfig) {
    ngfConfig.configure({
      name: 'MyApp',
      driver: [ // defaults to indexedDB -> webSQL -> localStorage
        Driver.INDEXED_DB,
        Driver.LOCAL_STORAGE
      ]
    });
  }
}

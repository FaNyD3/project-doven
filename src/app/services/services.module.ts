import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {ApiService} from "./api/api.service";
import {AuthService} from "./auth/auth.service";
import {BranchService} from "./branch/branch.service";
import {SessionGuard} from "./guards/session.guard";
import {LoadingService} from "./loading/loading.service";
// import {SharingService} from "./sharing/sharing.service";
import {LogisticsGuard} from "./guards/logistics.guard";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    ApiService,
    AuthService,
    SessionGuard,
    LoadingService,
    LogisticsGuard,
    BranchService
  ]
})
export class ServicesModule { }

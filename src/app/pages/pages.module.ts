import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from "../material/material.module";
import { PAGES_ROUTES } from "./pages.routes";
import { Menu } from "./menu";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { ChartsModule } from 'ng2-charts';
import { QuillModule } from 'ngx-quill';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ClientsComponent} from "./clients/clients.component";
import { ClientsTableComponent } from './clients/clients-table/clients-table.component';
import { SelectedClientComponent } from './clients/selected-client/selected-client.component';
import { ModalConfirmComponent} from "../modals/modal-confirm/modal-confirm.component";
import { ProfileComponent } from './profile/profile.component';
import { ProductsComponent } from './catalogs/products/products.component';
import { ProductsListComponent} from "../modals/products-list/products-list.component";
import { BranchComponent } from './catalogs/branches/branch/branch.component';
import { BranchesComponent } from './catalogs/branches/branches.component';
import { UsersComponent } from './catalogs/users/users.component';
import { UserComponent } from './catalogs/users/user/user.component';
import { ProductComponent } from './catalogs/products/product/product.component';
import { RemindersComponent } from './reminders/reminders.component';
import { NotesComponent } from "./notes/notes.component";


@NgModule({
  declarations: [
    DashboardComponent,
    ClientsComponent,
    ClientsTableComponent,
    SelectedClientComponent,
    ModalConfirmComponent,
    ProfileComponent,
    ProductsComponent,
    ProductComponent,
    ProductsListComponent,
    BranchComponent,
    BranchesComponent,
    UsersComponent,
    UserComponent,
    RemindersComponent,
    NotesComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    }),
    PAGES_ROUTES,
    ChartsModule,
      QuillModule,
      InfiniteScrollModule,
  ],
  providers: [
      Menu,
      // BranchService
  ],
  exports: [
  ],
  entryComponents: [
    ModalConfirmComponent,
    ProductsListComponent,
    BranchComponent,
    UserComponent,
    ProductsComponent,
    ProductComponent,
  ]
})
export class PagesModule { }

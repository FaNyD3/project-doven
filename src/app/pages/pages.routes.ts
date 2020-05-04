import {RouterModule, Routes} from "@angular/router";
import {BranchAdminGuard} from "../services/guards/branch-admin.guard";
import {GeneralAdminGuard} from "../services/guards/general-admin.guard";
import {LogisticsGuard} from "../services/guards/logistics.guard";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {ClientsComponent} from "./clients/clients.component";
import {ClientsTableComponent} from "./clients/clients-table/clients-table.component";
import {SelectedClientComponent} from "./clients/selected-client/selected-client.component";
import {ProfileComponent} from "./profile/profile.component";
import {ProductsComponent} from "./catalogs/products/products.component";
import {BranchesComponent} from "./catalogs/branches/branches.component";
import {UsersComponent} from "./catalogs/users/users.component";
import {RemindersComponent} from "./reminders/reminders.component";
import {NotesComponent} from "./notes/notes.component";


const pagesRoutes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
    data: {
      title: 'Perfil',
      orangeLine: 0
    }
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    data: {
      title: 'Tablero',
      orangeLine: 0
    }
  },
  {
    path: 'clients',
    component: ClientsComponent,
    data: {
      title: 'Pilotos',
      orangeLine: 1
    },
    children: [
      // { path: '', component: ClientsTableComponent },
      { path: '', component: ClientsTableComponent },
      { path: ':id', component: SelectedClientComponent }
    ]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    data: {
      title: 'Perfil',
      orangeLine: 10
    }
  },
  {
    path: 'products',
    component: ProductsComponent,
    data: {
      title: 'Productos',
      orangeLine: 3
    }
  },
  {
    path: 'branches',
    component: BranchesComponent,
    data: {
      title: 'Aerodromos', // antes de aerodromos eran sucursales
      orangeLine: 3
    }
  },
  {
    path: 'users',
    component: UsersComponent,
    // canActivate: [ BranchAdminGuard ],
    data: {
      title: 'Usuarios',
      orangeLine: 3
    }
  },
  /*
  {
    path: 'reminders',
    component: RemindersComponent,
    data: {
      title: 'Recordatorios',
      orangeLine: 5
    }
  },
  */
  {
    path: 'notes',
    component: NotesComponent,
    data: {
      title: 'Notes',
      orangeLine: 4
    }
  },
];

export const PAGES_ROUTES = RouterModule.forChild( pagesRoutes );

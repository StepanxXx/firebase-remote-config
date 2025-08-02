import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard.component';
import { Revisions } from './revisions/revisions';
import { Rollback } from './rollback/rollback';
import { VersionsComponent } from './versions/versions.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'revisions', component: Revisions },
  { path: 'rollback', component: Rollback },
  { path: 'versions', component: VersionsComponent }
];

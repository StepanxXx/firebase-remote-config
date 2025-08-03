import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VersionsComponent } from './versions/versions.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'versions', component: VersionsComponent }
];

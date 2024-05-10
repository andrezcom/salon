import { Routes } from '@angular/router';
import { TablaComponent } from './pages/ventas/tabla/tabla.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';

export const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent },
  { path: 'sales', component: TablaComponent },
  { path: '', pathMatch: 'full', redirectTo: '/welcome' }
];
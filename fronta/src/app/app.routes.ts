import { Routes } from '@angular/router';

import { WelcomeComponent } from './pages/welcome/welcome.component';
import { LoginComponent } from './admin/login/login.component';
import { RegisterComponent } from './admin/user/register/register.component';
import { ListaComponent } from './admin/user/listaJson/lista.component';
import { TablaComponentUs } from './admin/user/tabla/tabla.component';

export const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent },
  { path: 'admin/login', component: LoginComponent },
  { path: 'admin/register', component: RegisterComponent },
  { path: 'admin/lista', component: ListaComponent },
  { path: 'admin/user', component: TablaComponentUs },
  { path: '', pathMatch: 'full', redirectTo: '/welcome' },
  { path: '**', pathMatch: 'full', redirectTo: '/welcome' }
];
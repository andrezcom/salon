import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { LoginComponent } from './components/user/login/login.component';
import { TablaComponent } from './pages/sales/tabla/tabla.component';
import { RegisterComponent } from './components/user/register/register.component';

import { ListaComponent } from './components/user/lista/lista.component';

export const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent },
  { path: 'sales', component: TablaComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'lista', component: ListaComponent },
  { path: '', pathMatch: 'full', redirectTo: '/welcome' },
  { path: '**', pathMatch: 'full', redirectTo: '/welcome' }
];
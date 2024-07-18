import { Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './user/register/register.component';
import { ListaComponent } from './user/listaJson/lista.component';
import { TablaComponentUs } from './user/tabla/tabla.component';


export const ADMIN_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'lista', component: ListaComponent },
  { path: 'user', component: TablaComponentUs },
  { path: 'register', component: RegisterComponent },
];



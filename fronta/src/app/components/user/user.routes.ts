import { Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ListaComponent } from './listaJson/lista.component';
import { TablaComponentUs } from './tabla/tabla.component';


export const WELCOME_ROUTES: Routes = [
  { path: '', component: LoginComponent },
];

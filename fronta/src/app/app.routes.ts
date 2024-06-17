import { Routes } from '@angular/router';

import { WelcomeComponent } from './pages/welcome/welcome.component';
import { TablaComponentUs } from './components/user/tabla/tabla.component';
import { LoginComponent } from './components/user/login/login.component';
import { ListaComponent } from './components/user/listaJson/lista.component';


export const routes: Routes = [
  /* {
    path: '',
    loadChildren: () => import ('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES)
  },
  {
    path: 'user',
    loadChildren: () => import ('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES)
  }, */


  { path: 'login', component: LoginComponent },
  { path: 'welcome', component: WelcomeComponent },
  /*{ path: 'register', component: RegisterComponent },*/
  { path: 'lista', component: ListaComponent },
  { path: 'user', component: TablaComponentUs },
  { path: '', pathMatch: 'full', redirectTo: '/welcome' },
  { path: '**', pathMatch: 'full', redirectTo: '/welcome' }
];
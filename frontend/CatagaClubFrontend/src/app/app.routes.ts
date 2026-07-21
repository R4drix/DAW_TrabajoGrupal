import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Habitaciones } from './pages/habitaciones/habitaciones';
import { Sauna } from './pages/sauna/sauna';
import { Nosotros } from './pages/nosotros/nosotros';
import { Reservas } from './pages/reservas/reservas';
import { Restaurante } from './pages/restaurante/restaurante';
import { ReservarWizard } from './pages/reservar/reservar';
import { Login } from './pages/login/login';

import { AdminLayoutComponent } from './pages/admin/admin-layout/admin-layout';
import { AdminHome } from './pages/admin/admin-home/admin-home';
import { AdminReservas } from './pages/admin/admin-reservas/admin-reservas';
import { AdminRooms } from './pages/admin/admin-rooms/admin-rooms';
import { AdminSauna } from './pages/admin/admin-sauna/admin-sauna';
import { AdminComidas } from './pages/admin/admin-comidas/admin-comidas';

import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: Home,
  },
  {
    path: 'reservar',
    component: ReservarWizard,
  },
  {
    path: 'habitaciones',
    component: Habitaciones,
  },
  {
    path: 'sauna',
    component: Sauna,
  },
  {
    path: 'restaurante',
    component: Restaurante,
  },
  {
    path: 'nosotros',
    component: Nosotros,
  },
  {
    path: 'reservas',
    component: Reservas,
    canActivate: [authGuard],
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', component: AdminHome },
      { path: 'reservas', component: AdminReservas },
      { path: 'rooms', component: AdminRooms },
      { path: 'sauna', component: AdminSauna },
      { path: 'comidas', component: AdminComidas },
    ],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];

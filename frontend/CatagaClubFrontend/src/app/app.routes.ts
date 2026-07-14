import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Habitaciones } from './pages/habitaciones/habitaciones';
import { Sauna } from './pages/sauna/sauna';
import { Nosotros } from './pages/nosotros/nosotros';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Reservas } from './pages/reservas/reservas';
import { Restaurante } from './pages/restaurante/restaurante';

export const routes: Routes = [
  {
    path: '',
    component: Home,
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
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'reservas',
    component: Reservas,
  },
];
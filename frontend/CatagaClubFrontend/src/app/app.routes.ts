import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Habitaciones } from './pages/habitaciones/habitaciones';
import { Sauna } from './pages/sauna/sauna';
import { Nosotros } from './pages/nosotros/nosotros';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Reservas } from './pages/reservas/reservas';
import { Restaurante } from './pages/restaurante/restaurante';
import { ReservarWizard } from './pages/reservar/reservar';

export const routes: Routes = [
  {
    path: 'reservar',
    component: ReservarWizard,
  },
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

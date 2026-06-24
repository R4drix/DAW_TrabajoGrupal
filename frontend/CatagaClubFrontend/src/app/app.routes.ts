import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Habitaciones } from './pages/habitaciones/habitaciones';
import { Sauna } from './pages/sauna/sauna';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'habitaciones',
    component: Habitaciones
  },
  {
    path: 'sauna',
    component: Sauna
  },
];
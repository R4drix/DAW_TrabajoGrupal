import { Routes } from '@angular/router';

// Layouts principales
import { PublicLayout } from './pages/public-layout/public-layout';
import { AdminLayout } from './pages/admin/admin-layout/admin-layout';

// Páginas del Administrador
import { AdminDashboard } from './pages/admin/admin-dashboard/admin-dashboard';
import { AdminRecords } from './pages/admin/admin-records/admin-records';
import { AdminLogin } from './pages/admin/admin-login/admin-login'; // Asegúrate de tener este archivo creado

// Páginas Públicas
import { Home } from './pages/home/home';
import { Habitaciones } from './pages/habitaciones/habitaciones';
import { Sauna } from './pages/sauna/sauna';
import { Nosotros } from './pages/nosotros/nosotros';
import { Reservas } from './pages/reservas/reservas';
import { Restaurante } from './pages/restaurante/restaurante';

// Guardián de seguridad
import { adminGuard } from './guards/admin-guard';
import { AdminHabitaciones } from './pages/admin/admin-habitaciones/admin-habitaciones';
export const routes: Routes = [
  // 1. RUTAS PÚBLICAS (Cualquiera las puede ver)
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Home },
      { path: 'habitaciones', component: Habitaciones },
      { path: 'reservas', component: Reservas },
      { path: 'nosotros', component: Nosotros },
      { path: 'sauna', component: Sauna }
    ]
  },

  // 2. RUTA DE LOGIN
  { 
    path: 'admin/login', 
    component: AdminLogin 
  {
    path: 'restaurante',
    component: Restaurante,
  },
  {
    path: 'nosotros',
    component: Nosotros,
  },

  // 3. SI ESCRIBEN '/admin' A SECAS, VAN AL LOGIN
  {
    path: 'admin',
    pathMatch: 'full',
    redirectTo: 'admin/login'
  },

  // 🔒 4. EL SACO DE SEGURIDAD (Todo lo que esté aquí adentro exige ser Admin)
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard], // El guardián protege a este padre y a TODOS sus hijos
    children: [
      { path: 'dashboard', component: AdminDashboard },
      { path: 'registros', component: AdminRecords },
      { path: 'habitaciones', component: AdminHabitaciones }, // 👈 AQUÍ CONECTAS LA RUTA EXACTA
      
      // 🔥 AQUÍ TIENES QUE AGREGAR TODAS LAS PÁGINAS NUEVAS QUE ESTÁS CREANDO:
      // Por ejemplo:
      // { path: 'suites', component: AdminSuitesComponent },
      // { path: 'tiempos-salida', component: AdminTiemposComponent },
    ]
  },

  // 5. COMODÍN
  { path: '**', redirectTo: '' }
];
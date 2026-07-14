import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  const adminLogueado = localStorage.getItem('cataga_admin_user');

  alert('¡El Guard se disparó! El valor en localStorage es: ' + adminLogueado);

  if (adminLogueado && adminLogueado !== null && adminLogueado !== 'null' && adminLogueado !== 'undefined' && adminLogueado.trim() !== '') {
    return true;
  } else {
    localStorage.clear();
    router.navigate(['/admin/login']);
    return false;
  }
};